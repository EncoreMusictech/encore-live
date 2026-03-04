/**
 * Revenue Type Classifier
 * 
 * Maps statement fields (revenue_source, media_type, media_sub_type)
 * to standardised revenue types used for contract split application.
 * 
 * Canonical values: 'performance' | 'mechanical' | 'synch' | 'other'
 * Returns null when the input cannot be confidently classified.
 */

export type RevenueType = 'performance' | 'mechanical' | 'synch' | 'other';

// ── keyword sets (lowercase) ──────────────────────────────────────────

const PERFORMANCE_KEYWORDS = [
  'performance',
  'performing',
  'public performance',
  'broadcast',
  'radio',
  'television',
  'tv',
  'digital performance',
  'live performance',
  'background music',
  'general licensing',
  'blanket license',
  'webcasting',
  'non-interactive streaming',
];

const MECHANICAL_KEYWORDS = [
  'mechanical',
  'mechanicals',
  'reproduction',
  'digital mechanical',
  'physical mechanical',
  'ringtone',
  'interactive streaming',
  'on-demand',
  'download',
  'dpd',
  'limited download',
  'permanent download',
  'cd',
  'vinyl',
  'physical',
];

const SYNCH_KEYWORDS = [
  'sync',
  'synch',
  'synchronization',
  'synchronisation',
  'film',
  'motion picture',
  'audiovisual',
  'audio-visual',
  'audio visual',
  'commercial',
  'advertisement',
  'advertising',
  'trailer',
  'video game',
  'game',
  'lyric display',
];

// ── classifier ────────────────────────────────────────────────────────

function matchesKeywords(value: string, keywords: string[]): boolean {
  const lower = value.toLowerCase().trim();
  return keywords.some(kw => lower.includes(kw));
}

/**
 * Classify a single revenue allocation row into a revenue type.
 *
 * Checks `revenue_source` first, then `media_type`, then `media_sub_type`.
 * Returns null when no confident match is found (flagged for manual review).
 */
export function classifyRevenueType(
  revenueSource?: string | null,
  mediaType?: string | null,
  mediaSubType?: string | null,
): RevenueType | null {
  // Check fields in priority order
  const fields = [revenueSource, mediaType, mediaSubType].filter(Boolean) as string[];

  if (fields.length === 0) return null;

  for (const field of fields) {
    if (matchesKeywords(field, PERFORMANCE_KEYWORDS)) return 'performance';
    if (matchesKeywords(field, MECHANICAL_KEYWORDS)) return 'mechanical';
    if (matchesKeywords(field, SYNCH_KEYWORDS)) return 'synch';
  }

  // If we have input but can't classify, mark as 'other' rather than null
  // null is reserved for truly empty / unmappable rows
  return 'other';
}

/**
 * Bulk-classify an array of mapped rows, returning the classified type for each.
 */
export function classifyRows(
  rows: Array<Record<string, any>>,
): Array<RevenueType | null> {
  return rows.map(row =>
    classifyRevenueType(
      row['REVENUE SOURCE'] || row['revenue_source'],
      row['MEDIA TYPE'] || row['media_type'],
      row['MEDIA SUB-TYPE'] || row['media_sub_type'],
    ),
  );
}
