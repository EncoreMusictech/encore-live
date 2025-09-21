import { CopyrightWriter } from '@/hooks/useCopyright';
import { MLCLookupResult, MLCWriter, MLCPublisher } from '@/hooks/useMLCLookup';

/**
 * Normalizes MLC API response data to CopyrightWriter format
 */
export function normalizeMLCDataToWriters(mlcResult: MLCLookupResult): CopyrightWriter[] {
  if (!mlcResult || !mlcResult.found || !mlcResult.writers) {
    return [];
  }

  const writers: CopyrightWriter[] = [];
  const processedIPIs = new Set<string>();

  // Process writers from MLC data
  mlcResult.writers.forEach((mlcWriter) => {
    // Normalize writer name to "First Last" format
    const normalizedName = normalizeWriterName(mlcWriter);
    
    // Skip if we already processed this IPI (merge duplicates by IPI)
    if (mlcWriter.writerIPI && processedIPIs.has(mlcWriter.writerIPI)) {
      return;
    }

    if (mlcWriter.writerIPI) {
      processedIPIs.add(mlcWriter.writerIPI);
    }

    // Find matching publisher for this writer
    const matchingPublisher = findMatchingPublisher(mlcWriter, mlcResult.publishers || []);

    // Determine controlled status based on publisher matching
    const controlledStatus = determineControlledStatus(matchingPublisher);

    const writer: CopyrightWriter = {
      id: `mlc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      copyright_id: '',
      writer_name: normalizedName,
      ipi_number: mlcWriter.writerIPI || null,
      cae_number: mlcWriter.cae || null,
      isni: null,
      writer_role: normalizeWriterRole(mlcWriter.role),
      pro_affiliation: mlcWriter.name || null, // MLC sometimes puts PRO in name field
      nationality: null,
      ownership_percentage: mlcWriter.share || 0,
      mechanical_share: 0,
      performance_share: 0,
      synchronization_share: 0,
      controlled_status: controlledStatus,
      created_at: new Date().toISOString()
    };

    writers.push(writer);
  });

  return writers;
}

/**
 * Normalizes writer name to consistent "First Last" format
 */
function normalizeWriterName(mlcWriter: MLCWriter): string {
  // If we have first and last name separately
  if (mlcWriter.writerFirstName && mlcWriter.writerLastName) {
    return `${mlcWriter.writerFirstName.trim()} ${mlcWriter.writerLastName.trim()}`;
  }

  // If we have a combined name field
  if (mlcWriter.name) {
    return mlcWriter.name.trim();
  }

  // Fallback: construct from available fields
  const parts = [
    mlcWriter.writerFirstName?.trim(),
    mlcWriter.writerLastName?.trim()
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' ') : 'Unknown Writer';
}

/**
 * Normalizes writer role from MLC format to our format
 */
function normalizeWriterRole(role?: string): string {
  if (!role) return 'composer';

  const roleMap: Record<string, string> = {
    'writer': 'composer',
    'composer': 'composer',
    'author': 'author',
    'lyricist': 'author',
    'arranger': 'arranger',
    'adapter': 'adapter',
    'translator': 'translator'
  };

  const normalizedRole = role.toLowerCase().trim();
  return roleMap[normalizedRole] || 'composer';
}

/**
 * Finds matching publisher for a writer
 */
function findMatchingPublisher(writer: MLCWriter, publishers: MLCPublisher[]): MLCPublisher | null {
  if (!publishers || publishers.length === 0) return null;

  // Try to match by IPI first
  if (writer.writerIPI) {
    const matchByIPI = publishers.find(pub => 
      pub.publisherIpiNumber === writer.writerIPI
    );
    if (matchByIPI) return matchByIPI;
  }

  // Try to match by name similarity
  const writerName = normalizeWriterName(writer).toLowerCase();
  const nameMatch = publishers.find(pub => {
    const pubName = (pub.publisherName || pub.name || '').toLowerCase();
    return pubName.includes(writerName) || writerName.includes(pubName);
  });

  return nameMatch || null;
}

/**
 * Determines controlled status based on publisher matching
 * This is a simplified version - in real implementation, you'd check against
 * a controlled publishers list
 */
function determineControlledStatus(publisher: MLCPublisher | null): 'Controlled' | 'NC' | 'Admin' {
  if (!publisher) return 'NC';

  // Check against common controlled publisher names
  const controlledPublishers = [
    'self-published',
    'admin',
    'administrator',
    'controlled',
    // Add your controlled publisher aliases here
  ];

  const publisherName = (publisher.publisherName || publisher.name || '').toLowerCase();
  const isControlled = controlledPublishers.some(controlled => 
    publisherName.includes(controlled)
  );

  return isControlled ? 'Controlled' : 'NC';
}

/**
 * Validates and cleans share percentages
 */
export function validateSharePercentages(writers: CopyrightWriter[]): {
  isValid: boolean;
  totalShare: number;
  hasEstimated: boolean;
} {
  let totalShare = 0;
  let hasEstimated = false;

  writers.forEach(writer => {
    if (writer.ownership_percentage) {
      totalShare += writer.ownership_percentage;
    } else {
      hasEstimated = true;
    }
  });

  return {
    isValid: totalShare <= 100,
    totalShare,
    hasEstimated
  };
}

/**
 * Merges MLC writers with existing writers, handling duplicates
 */
export function mergeWritersWithExisting(
  mlcWriters: CopyrightWriter[],
  existingWriters: CopyrightWriter[]
): {
  merged: CopyrightWriter[];
  conflicts: Array<{ mlc: CopyrightWriter; existing: CopyrightWriter }>;
} {
  const merged: CopyrightWriter[] = [...existingWriters];
  const conflicts: Array<{ mlc: CopyrightWriter; existing: CopyrightWriter }> = [];

  mlcWriters.forEach(mlcWriter => {
    // Check for conflicts by IPI or name
    const existingMatch = existingWriters.find(existing => 
      (existing.ipi_number && mlcWriter.ipi_number && existing.ipi_number === mlcWriter.ipi_number) ||
      existing.writer_name.toLowerCase() === mlcWriter.writer_name.toLowerCase()
    );

    if (existingMatch) {
      conflicts.push({ mlc: mlcWriter, existing: existingMatch });
    } else {
      merged.push(mlcWriter);
    }
  });

  return { merged, conflicts };
}

/**
 * Creates a cache key for MLC lookups
 */
export function createMLCCacheKey(type: 'ISWC' | 'ISRC', identifier: string): string {
  return `mlc-${type.toLowerCase()}-${identifier.toUpperCase()}`;
}

/**
 * Checks if cached MLC data is still valid (24 hour TTL)
 */
export function isCacheValid(timestamp: string): boolean {
  const cacheTime = new Date(timestamp).getTime();
  const now = Date.now();
  const twentyFourHours = 24 * 60 * 60 * 1000;
  
  return (now - cacheTime) < twentyFourHours;
}