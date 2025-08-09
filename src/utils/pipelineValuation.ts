// Deterministic rules-based pipeline valuation utilities
// No external AI; uses metadata completeness and verification status heuristics

export type VerificationStatus = 'pro_verified' | 'bmi_verified' | 'ai_generated' | 'discovered' | 'unknown';

export interface SongMetaForPipeline {
  id: string;
  song_title: string;
  metadata_completeness_score?: number; // 0..1
  verification_status?: VerificationStatus | string;
  iswc?: string | null;
  publishers?: Record<string, number> | null;
  estimated_splits?: Record<string, number> | null;
  pro_registrations?: Record<string, unknown> | null;
}

export interface PipelineConfig {
  platformFee: number; // e.g., 0.30
  publishingShareFactor: number; // e.g., 0.25 of total rev to publishing
  territoryWeights: { domestic: number; intl: number }; // 0.7 / 0.3
  lagMonths: { domestic: number; intl: number }; // 4 / 6
  decay: { baseK: number; minK: number; maxK: number };
  streamWeights: { performance: number; mechanical: number; sync: number }; // should sum to 1
}

export interface SongPipelineResult {
  songId: string;
  title: string;
  monthlyNetR0: number;
  k: number;
  basePipeline: number;
  collectability: number;
  collectiblePipeline: number;
  breakdown: { performance: number; mechanical: number; sync: number };
  confidence: 'high' | 'medium' | 'low';
}

export interface CatalogPipelineResult {
  total: number;
  breakdown: { performance: number; mechanical: number; sync: number };
  scenario: { low: number; base: number; high: number };
  songResults: SongPipelineResult[];
  confidenceScore: number; // 0..100
}

export const defaultPipelineConfig: PipelineConfig = {
  platformFee: 0.30,
  publishingShareFactor: 0.25,
  territoryWeights: { domestic: 0.7, intl: 0.3 },
  lagMonths: { domestic: 4, intl: 6 },
  decay: { baseK: 0.12, minK: 0.06, maxK: 0.25 },
  streamWeights: { performance: 0.6, mechanical: 0.3, sync: 0.1 },
};

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }

function estimateAnnualGrossFromCompleteness(score: number, verified: boolean): number {
  // Piecewise heuristic anchored to metadata quality
  if (score >= 0.85) return verified ? 1400 : 1200;
  if (score >= 0.7) return verified ? 800 : 600;
  if (score >= 0.5) return verified ? 300 : 250;
  return verified ? 150 : 100;
}

function collectabilityFactor(song: SongMetaForPipeline): number {
  let p = 1.0;
  const hasPro = !!(song.pro_registrations && Object.keys(song.pro_registrations).length > 0);
  const hasISWC = !!song.iswc;
  const hasSplits = !!(song.estimated_splits && Object.keys(song.estimated_splits).length > 0);
  const hasPublishers = !!(song.publishers && Object.keys(song.publishers).length > 0);
  const status = (song.verification_status || 'unknown').toLowerCase();

  if (!hasPro) p *= 0.7;
  if (!hasISWC) p *= 0.8;
  if (!hasSplits) p *= 0.85;
  if (!hasPublishers) p *= 0.9;

  if (status === 'pro_verified' || status === 'bmi_verified') p = Math.min(1.0, p * 1.1);

  // Extra leakage risk if totally unverified
  if ((status === 'discovered' || status === 'unknown') && !hasISWC) p *= 0.8;

  return clamp(p, 0, 1);
}

function confidenceFromSong(song: SongMetaForPipeline): 'high' | 'medium' | 'low' {
  const status = (song.verification_status || 'unknown').toLowerCase();
  const score = song.metadata_completeness_score ?? 0;
  if ((status === 'pro_verified' || status === 'bmi_verified') && score >= 0.75) return 'high';
  if (score >= 0.6) return 'medium';
  return 'low';
}

export function computeSongPipeline(song: SongMetaForPipeline, cfg: PipelineConfig = defaultPipelineConfig): SongPipelineResult {
  const completeness = song.metadata_completeness_score ?? 0.6;
  const verified = ['pro_verified', 'bmi_verified'].includes((song.verification_status || '').toLowerCase());

  // Estimate monthly net publishing revenue R0 after fees and share factor
  const annualGross = estimateAnnualGrossFromCompleteness(completeness, verified);
  const monthlyGross = annualGross / 12;
  const monthlyNetR0 = monthlyGross * (1 - cfg.platformFee) * cfg.publishingShareFactor;

  // Decay k adjusted by metadata
  let k = cfg.decay.baseK;
  if (verified) k -= 0.02;
  if (!song.iswc) k += 0.04;
  if (completeness < 0.6) k += 0.03;
  k = clamp(k, cfg.decay.minK, cfg.decay.maxK);

  // Pipeline base across lag windows and territory mix
  const domM = cfg.lagMonths.domestic;
  const intM = cfg.lagMonths.intl;
  let pipelineBase = 0;
  for (let m = 1; m <= domM; m++) pipelineBase += monthlyNetR0 * Math.exp(-k * m) * cfg.territoryWeights.domestic;
  for (let m = 1; m <= intM; m++) pipelineBase += monthlyNetR0 * Math.exp(-k * m) * cfg.territoryWeights.intl;

  const collectability = collectabilityFactor(song);
  const collectible = pipelineBase * collectability;

  const breakdown = {
    performance: collectible * cfg.streamWeights.performance,
    mechanical: collectible * cfg.streamWeights.mechanical,
    sync: collectible * cfg.streamWeights.sync,
  };

  return {
    songId: song.id,
    title: song.song_title,
    monthlyNetR0,
    k,
    basePipeline: pipelineBase,
    collectability,
    collectiblePipeline: collectible,
    breakdown,
    confidence: confidenceFromSong(song),
  };
}

export function computeCatalogPipeline(songs: SongMetaForPipeline[], cfg: PipelineConfig = defaultPipelineConfig): CatalogPipelineResult {
  const results = songs.map((s) => computeSongPipeline(s, cfg));
  const total = results.reduce((sum, r) => sum + r.collectiblePipeline, 0);
  const breakdown = results.reduce(
    (acc, r) => ({
      performance: acc.performance + r.breakdown.performance,
      mechanical: acc.mechanical + r.breakdown.mechanical,
      sync: acc.sync + r.breakdown.sync,
    }),
    { performance: 0, mechanical: 0, sync: 0 }
  );

  // Scenario bands: +-20% based on conservative/aggressive assumptions
  const scenario = {
    low: total * 0.8,
    base: total,
    high: total * 1.2,
  };

  // Confidence score: base 50 + data completeness + depth - penalties
  const avgCompleteness = songs.length
    ? songs.reduce((s, x) => s + (x.metadata_completeness_score ?? 0), 0) / songs.length
    : 0;
  const verifiedCount = songs.filter((s) => ['pro_verified', 'bmi_verified'].includes((s.verification_status || '').toLowerCase())).length;
  const hasISWC = songs.filter((s) => !!s.iswc).length;
  const hasSplits = songs.filter((s) => s.estimated_splits && Object.keys(s.estimated_splits).length > 0).length;

  let confidence = 50;
  confidence += Math.round(avgCompleteness * 20); // up to +20
  confidence += Math.min(10, Math.floor(songs.length / 10)); // depth bonus up to +10
  confidence += Math.min(10, verifiedCount > 0 ? 10 : 0); // any verified boosts +10
  confidence += Math.min(8, hasISWC > 0 ? 8 : 0);
  confidence += Math.min(8, hasSplits > 0 ? 8 : 0);
  confidence = clamp(confidence, 0, 100);

  return { total, breakdown, scenario, songResults: results, confidenceScore: confidence };
}
