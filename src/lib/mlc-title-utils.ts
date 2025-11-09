/**
 * Utility functions for normalizing and parsing MLC work titles
 */

/**
 * Parse artist name from title featuring patterns
 * Examples:
 * - "Song ft. Artist" -> "Artist"
 * - "Song (feat. Artist)" -> "Artist"
 * - "Song featuring Artist" -> "Artist"
 */
export function parseArtistFromTitle(title: string): string | undefined {
  const patterns = [
    /\bft\.?\s+([^)\]]+)/i,
    /\bfeat\.?\s+([^)\]]+)/i,
    /\bfeaturing\s+([^)\]]+)/i,
    /\bwith\s+([^)\]]+)/i,
  ];

  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return undefined;
}

/**
 * Generate multiple normalized variants of a title for better matching
 */
export function generateTitleVariants(title: string): string[] {
  const variants: string[] = [];
  
  // Original title
  variants.push(title);
  
  // Strip featuring/ft patterns
  const withoutFeat = title
    .replace(/\s*[\(\[]?\s*(ft\.?|feat\.?|featuring|with)\s+[^\)\]]*[\)\]]?\s*/gi, '')
    .trim();
  if (withoutFeat !== title) {
    variants.push(withoutFeat);
  }
  
  // Strip all parentheses and brackets
  const withoutParens = title
    .replace(/[\(\[\{].*?[\)\]\}]/g, '')
    .trim();
  if (withoutParens !== title && !variants.includes(withoutParens)) {
    variants.push(withoutParens);
  }
  
  // Strip common punctuation
  const withoutPunctuation = title
    .replace(/[',.:;!?-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (withoutPunctuation !== title && !variants.includes(withoutPunctuation)) {
    variants.push(withoutPunctuation);
  }
  
  // Lowercase variant (for case-insensitive matching)
  const lowercase = title.toLowerCase();
  if (!variants.some(v => v.toLowerCase() === lowercase)) {
    variants.push(lowercase);
  }
  
  return variants.filter(v => v.length > 0);
}

/**
 * Extract clean work title without featured artists
 */
export function extractCleanTitle(title: string): string {
  return title
    .replace(/\s*[\(\[]?\s*(ft\.?|feat\.?|featuring|with)\s+[^\)\]]*[\)\]]?\s*/gi, '')
    .replace(/[\(\[\{].*?[\)\]\}]/g, '')
    .trim();
}

/**
 * Normalize title for comparison
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[',.:;!?-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
