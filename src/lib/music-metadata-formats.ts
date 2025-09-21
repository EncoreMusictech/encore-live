/**
 * Utility functions for formatting music metadata identifiers
 * to their correct standard formats
 */

/**
 * Format ISWC (International Standard Musical Work Code) to T-123456789-0 format
 * @param iswc - Raw ISWC string from various sources
 * @returns Formatted ISWC string or original if invalid
 */
export const formatISWC = (iswc: string): string => {
  if (!iswc) return '';
  
  // Remove all non-alphanumeric characters
  const cleaned = iswc.replace(/[^A-Za-z0-9]/g, '');
  
  // Check if it already has T prefix
  let workingString = cleaned.toUpperCase();
  
  // Remove T prefix if present to work with just numbers
  if (workingString.startsWith('T')) {
    workingString = workingString.substring(1);
  }
  
  // ISWC should be 10 digits total (9 digits + 1 check digit)
  if (workingString.length === 10 && /^\d+$/.test(workingString)) {
    const mainCode = workingString.substring(0, 9);
    const checkDigit = workingString.substring(9, 10);
    return `T-${mainCode}-${checkDigit}`;
  }
  
  // If it's 9 digits, calculate check digit (simplified - would need proper algorithm)
  if (workingString.length === 9 && /^\d+$/.test(workingString)) {
    // For now, append 0 as check digit (in real implementation, calculate proper check digit)
    return `T-${workingString}-0`;
  }
  
  // Return original if we can't format it properly
  return iswc;
};

/**
 * Format ISRC (International Standard Recording Code) to proper format
 * @param isrc - Raw ISRC string from various sources
 * @returns Formatted ISRC string or original if invalid
 */
export const formatISRC = (isrc: string): string => {
  if (!isrc) return '';
  
  // Remove all non-alphanumeric characters and convert to uppercase
  const cleaned = isrc.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  
  // ISRC should be exactly 12 characters: CCXXXYYNNNNN
  // CC = Country Code (2 letters)
  // XXX = Registrant Code (3 alphanumeric)
  // YY = Year (2 digits)
  // NNNNN = Designation (5 digits)
  
  if (cleaned.length === 12) {
    const countryCode = cleaned.substring(0, 2);
    const registrantCode = cleaned.substring(2, 5);
    const year = cleaned.substring(5, 7);
    const designation = cleaned.substring(7, 12);
    
    // Validate format: first 2 should be letters, positions 5-6 should be digits, last 5 should be digits
    if (/^[A-Z]{2}/.test(countryCode) && 
        /^\d{2}$/.test(year) && 
        /^\d{5}$/.test(designation)) {
      return `${countryCode}${registrantCode}${year}${designation}`;
    }
  }
  
  // Return original if we can't format it properly
  return isrc;
};

/**
 * Validate ISWC format
 * @param iswc - ISWC string to validate
 * @returns boolean indicating if format is valid
 */
export const validateISWC = (iswc: string): boolean => {
  if (!iswc) return false;
  
  // Check for T-xxxxxxxxx-x format
  const iswcRegex = /^T-\d{9}-\d$/;
  return iswcRegex.test(iswc);
};

/**
 * Validate ISRC format
 * @param isrc - ISRC string to validate
 * @returns boolean indicating if format is valid
 */
export const validateISRC = (isrc: string): boolean => {
  if (!isrc) return false;
  
  // Check for proper ISRC format: 2 letters + 3 alphanumeric + 2 digits + 5 digits
  const isrcRegex = /^[A-Z]{2}[A-Z0-9]{3}\d{7}$/;
  return isrcRegex.test(isrc);
};

/**
 * Apply formatting to Spotify metadata
 * @param metadata - Spotify metadata object
 * @returns Formatted metadata object
 */
export const formatSpotifyMetadata = (metadata: any) => {
  if (!metadata) return metadata;
  
  return {
    ...metadata,
    iswc: metadata.iswc ? formatISWC(metadata.iswc) : metadata.iswc,
    isrc: metadata.isrc ? formatISRC(metadata.isrc) : metadata.isrc
  };
};