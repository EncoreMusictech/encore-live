import territoriesCSV from '@/assets/territories-lookup.csv?raw';

// Parse CSV and create lookup map
const parseTerritoryLookup = (): Map<string, string> => {
  const lookup = new Map<string, string>();
  const lines = territoriesCSV.split('\n');
  
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse CSV line handling quoted values
    const match = line.match(/^"?([^",]+)"?,\s*([A-Z]{2})$/);
    if (match) {
      const [, territory, code] = match;
      lookup.set(territory.trim().toUpperCase(), code);
    }
  }
  
  return lookup;
};

const territoryLookup = parseTerritoryLookup();

/**
 * Normalize a territory name or code to its standard 2-letter code
 */
export const normalizeTerritoryCode = (territory: string | null | undefined): string => {
  if (!territory) return '';
  
  const normalized = territory.trim().toUpperCase();
  
  // Direct lookup
  const code = territoryLookup.get(normalized);
  if (code) return code;
  
  // If it's already a 2-letter code, return as-is
  if (/^[A-Z]{2}$/.test(normalized)) {
    return normalized;
  }
  
  // No match found, return original
  return territory;
};

/**
 * Normalize multiple territories separated by commas or semicolons
 */
export const normalizeMultipleTerritories = (territories: string | null | undefined): string => {
  if (!territories) return '';
  
  const parts = territories.split(/[,;]/).map(t => t.trim()).filter(Boolean);
  const normalized = parts.map(normalizeTerritoryCode);
  
  return normalized.join(', ');
};
