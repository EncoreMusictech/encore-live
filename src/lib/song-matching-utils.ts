/**
 * Song matching utilities with confidence calculation
 */

export interface MatchingSong {
  songTitle: string;
  artist: string;
  iswc?: string;
  grossAmount?: number;
}

export interface CopyrightWork {
  id: string;
  work_title: string;
  internal_id: string;
  iswc?: string;
  akas?: string[];
  copyright_writers?: Array<{
    writer_name: string;
    ownership_percentage: number;
    writer_role: string;
  }>;
}

export interface ConfidenceFactors {
  titleSimilarity: number;
  artistSimilarity: number;
  iswcMatch: boolean;
  akaMatch: boolean;
  writerMatch: boolean;
}

export interface MatchResult {
  copyright: CopyrightWork;
  confidence: number;
  factors: ConfidenceFactors;
  matchType: 'exact' | 'high' | 'medium' | 'low';
}

/**
 * Calculate Jaro-Winkler similarity between two strings
 */
function jaroWinklerSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const str1 = s1.toLowerCase();
  const str2 = s2.toLowerCase();

  const matchWindow = Math.max(str1.length, str2.length) / 2 - 1;
  const str1Matches = new Array(str1.length).fill(false);
  const str2Matches = new Array(str2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Find matches
  for (let i = 0; i < str1.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, str2.length);

    for (let j = start; j < end; j++) {
      if (str2Matches[j] || str1[i] !== str2[j]) continue;
      str1Matches[i] = str2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  // Find transpositions
  let k = 0;
  for (let i = 0; i < str1.length; i++) {
    if (!str1Matches[i]) continue;
    while (!str2Matches[k]) k++;
    if (str1[i] !== str2[k]) transpositions++;
    k++;
  }

  const jaro = (matches / str1.length + matches / str2.length + (matches - transpositions / 2) / matches) / 3;
  
  // Winkler modification
  let prefix = 0;
  for (let i = 0; i < Math.min(str1.length, str2.length, 4); i++) {
    if (str1[i] === str2[i]) prefix++;
    else break;
  }

  return jaro + (0.1 * prefix * (1 - jaro));
}

/**
 * Normalize string for comparison
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Calculate confidence factors for a song-copyright match
 */
export function calculateConfidenceFactors(
  song: MatchingSong,
  copyright: CopyrightWork
): ConfidenceFactors {
  const normalizedSongTitle = normalizeString(song.songTitle);
  const normalizedWorkTitle = normalizeString(copyright.work_title);
  const normalizedArtist = normalizeString(song.artist);

  // Title similarity using Jaro-Winkler
  const titleSimilarity = jaroWinklerSimilarity(normalizedSongTitle, normalizedWorkTitle);

  // Check AKA matches
  let akaMatch = false;
  if (copyright.akas && Array.isArray(copyright.akas)) {
    akaMatch = copyright.akas.some(aka => 
      jaroWinklerSimilarity(normalizedSongTitle, normalizeString(aka)) > 0.9
    );
  }

  // ISWC exact match
  const iswcMatch = !!(song.iswc && copyright.iswc && song.iswc === copyright.iswc);

  // Artist/writer similarity
  let artistSimilarity = 0;
  let writerMatch = false;
  
  if (copyright.copyright_writers && copyright.copyright_writers.length > 0) {
    const writerNames = copyright.copyright_writers.map(w => normalizeString(w.writer_name));
    
    // Check if artist name appears in writers
    writerMatch = writerNames.some(writerName => 
      jaroWinklerSimilarity(normalizedArtist, writerName) > 0.8
    );
    
    // Calculate best artist similarity score
    artistSimilarity = Math.max(
      ...writerNames.map(writerName => 
        jaroWinklerSimilarity(normalizedArtist, writerName)
      )
    );
  }

  return {
    titleSimilarity,
    artistSimilarity,
    iswcMatch,
    akaMatch,
    writerMatch
  };
}

/**
 * Calculate overall confidence score from factors
 */
export function calculateConfidenceScore(factors: ConfidenceFactors): number {
  let score = 0;
  
  // Title similarity is most important (40% weight)
  score += factors.titleSimilarity * 0.4;
  
  // Artist similarity (25% weight)
  score += factors.artistSimilarity * 0.25;
  
  // Exact matches get significant boosts
  if (factors.iswcMatch) score += 0.2; // ISWC match is very strong
  if (factors.akaMatch) score += 0.1; // AKA match is good
  if (factors.writerMatch) score += 0.05; // Writer match is helpful
  
  // Cap at 1.0
  return Math.min(score, 1.0);
}

/**
 * Determine match type based on confidence score
 */
export function getMatchType(confidence: number): 'exact' | 'high' | 'medium' | 'low' {
  if (confidence >= 0.95) return 'exact';
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.6) return 'medium';
  return 'low';
}

/**
 * Find potential matches for a song
 */
export function findPotentialMatches(
  song: MatchingSong,
  copyrights: CopyrightWork[],
  minConfidence: number = 0.3
): MatchResult[] {
  const matches: MatchResult[] = [];

  for (const copyright of copyrights) {
    const factors = calculateConfidenceFactors(song, copyright);
    const confidence = calculateConfidenceScore(factors);
    
    if (confidence >= minConfidence) {
      matches.push({
        copyright,
        confidence,
        factors,
        matchType: getMatchType(confidence)
      });
    }
  }

  // Sort by confidence descending
  return matches.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Get best match for a song
 */
export function getBestMatch(
  song: MatchingSong,
  copyrights: CopyrightWork[],
  minConfidence: number = 0.6
): MatchResult | null {
  const matches = findPotentialMatches(song, copyrights, minConfidence);
  return matches.length > 0 ? matches[0] : null;
}

/**
 * Batch process multiple songs for matching
 */
export function batchMatchSongs(
  songs: MatchingSong[],
  copyrights: CopyrightWork[],
  minConfidence: number = 0.6
): Map<string, MatchResult | null> {
  const results = new Map<string, MatchResult | null>();

  for (const song of songs) {
    const key = `${song.songTitle}-${song.artist}`.toLowerCase();
    const bestMatch = getBestMatch(song, copyrights, minConfidence);
    results.set(key, bestMatch);
  }

  return results;
}

/**
 * Get confidence level description
 */
export function getConfidenceDescription(confidence: number): string {
  if (confidence >= 0.95) return 'Exact match - Very high confidence';
  if (confidence >= 0.8) return 'High confidence match';
  if (confidence >= 0.6) return 'Medium confidence match';
  if (confidence >= 0.4) return 'Low confidence match';
  return 'Very low confidence match';
}

/**
 * Get confidence color for UI display
 */
export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'text-green-600';
  if (confidence >= 0.6) return 'text-blue-600';
  if (confidence >= 0.4) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Get confidence badge variant
 */
export function getConfidenceBadgeVariant(confidence: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (confidence >= 0.8) return 'default'; // Green
  if (confidence >= 0.6) return 'secondary'; // Blue
  if (confidence >= 0.4) return 'outline'; // Yellow
  return 'destructive'; // Red
}