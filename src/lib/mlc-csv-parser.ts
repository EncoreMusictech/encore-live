/**
 * MLC CSV Parser
 * Parses MLC Work Report exports and transforms them into internal copyright format
 */

interface MLCRow {
  'MLC Song Code': string;
  'Primary Title': string;
  'ISWC': string;
  'Member Song IDs': string;
  'Artists': string;
  'Party Id': string;
  'Party Name': string;
  'Party IPI': string;
  'Party Role': string;
  'Collectible Share': string;
  'Chain of Title Id': string;
  'Chain of Title Parent Id': string;
}

export interface ParsedCopyright {
  work_title: string;
  iswc?: string;
  album_title?: string;
  creation_date?: string;
  copyright_date?: string;
  language_code?: string;
  work_type?: string;
  contains_sample?: boolean;
  duration_seconds?: number;
  notes?: string;
  writers?: ParsedWriter[];
  publishers?: ParsedPublisher[];
  recordings?: ParsedRecording[];
  errors?: string[];
  warnings?: string[];
  row_number?: number;
}

export interface ParsedWriter {
  writer_name: string;
  ownership_percentage: number;
  writer_role?: string;
  ipi_number?: string;
  controlled_status?: string;
  pro_affiliation?: string;
}

export interface ParsedPublisher {
  publisher_name: string;
  ownership_percentage: number;
  publisher_role?: string;
  ipi_number?: string;
  pro_affiliation?: string;
}

export interface ParsedRecording {
  recording_title?: string;
  artist_name?: string;
  isrc?: string;
  release_date?: string;
  duration_seconds?: number;
}

/**
 * Detects if a CSV is in MLC format by checking for key headers
 */
export function isMLCFormat(headers: string[]): boolean {
  const mlcHeaders = ['MLC Song Code', 'Primary Title', 'Party Role', 'Party Name'];
  return mlcHeaders.every(header => headers.includes(header));
}

/**
 * Cleans party name by removing ", null" suffix and extra spaces
 */
function cleanPartyName(name: string): string {
  if (!name) return '';
  return name
    .replace(/, null$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalizes writer role from MLC format
 */
function normalizeWriterRole(role: string): string {
  const roleLower = role.toLowerCase();
  if (roleLower.includes('composer') || roleLower.includes('author')) {
    return 'Composer';
  }
  return 'Writer';
}

/**
 * Normalizes publisher role from MLC format
 */
function normalizePublisherRole(role: string): string {
  const roleLower = role.toLowerCase();
  if (roleLower.includes('administrator')) {
    return 'Administrator';
  }
  if (roleLower.includes('original')) {
    return 'Original Publisher';
  }
  return 'Publisher';
}

/**
 * Determines if a party is a writer/composer or publisher
 */
function isWriter(partyRole: string): boolean {
  const roleLower = partyRole.toLowerCase();
  return roleLower.includes('composer') || 
         roleLower.includes('author') || 
         roleLower.includes('writer');
}

/**
 * Parses MLC CSV format and groups by work
 */
export function parseMLCFormat(rawData: any[]): ParsedCopyright[] {
  // Group rows by MLC Song Code
  const workGroups = new Map<string, MLCRow[]>();
  
  rawData.forEach(row => {
    const songCode = row['MLC Song Code'];
    if (!songCode) return;
    
    if (!workGroups.has(songCode)) {
      workGroups.set(songCode, []);
    }
    workGroups.get(songCode)!.push(row);
  });

  console.log(`Found ${workGroups.size} unique works in MLC export`);

  // Process each work group
  const processed: ParsedCopyright[] = [];
  let rowNumber = 2; // Start at 2 for header

  workGroups.forEach((rows, songCode) => {
    if (rows.length === 0) return;

    const firstRow = rows[0];
    const work: ParsedCopyright = {
      work_title: firstRow['Primary Title'] || '',
      row_number: rowNumber,
      errors: [],
      warnings: [],
      writers: [],
      publishers: [],
      recordings: []
    };

    // Add ISWC if present
    const iswc = firstRow['ISWC']?.trim();
    if (iswc) {
      work.iswc = iswc;
    }

    // Add artist info as recording
    const artists = firstRow['Artists']?.trim();
    if (artists) {
      work.recordings = [{
        recording_title: work.work_title,
        artist_name: artists
      }];
    }

    // Add MLC Song Code as note
    work.notes = `MLC Song Code: ${songCode}`;

    // Process all parties (writers and publishers)
    const seenWriters = new Set<string>();
    const seenPublishers = new Set<string>();

    rows.forEach(row => {
      const partyName = cleanPartyName(row['Party Name']);
      const partyRole = row['Party Role'];
      const partyIPI = row['Party IPI']?.trim();
      const collectibleShare = row['Collectible Share']?.trim();

      if (!partyName || !partyRole) return;

      if (isWriter(partyRole)) {
        // Add writer
        const writerKey = `${partyName}-${partyIPI || 'no-ipi'}`;
        if (!seenWriters.has(writerKey)) {
          seenWriters.add(writerKey);
          
          const writer: ParsedWriter = {
            writer_name: partyName,
            ownership_percentage: 0, // MLC doesn't provide writer ownership %
            writer_role: normalizeWriterRole(partyRole)
          };

          if (partyIPI) {
            writer.ipi_number = partyIPI;
          }

          work.writers!.push(writer);
        }
      } else {
        // Add publisher
        const publisherKey = `${partyName}-${partyRole}`;
        if (!seenPublishers.has(publisherKey)) {
          seenPublishers.add(publisherKey);
          
          const ownership = collectibleShare ? parseFloat(collectibleShare) : 0;
          
          const publisher: ParsedPublisher = {
            publisher_name: partyName,
            ownership_percentage: isNaN(ownership) ? 0 : ownership,
            publisher_role: normalizePublisherRole(partyRole)
          };

          if (partyIPI) {
            publisher.ipi_number = partyIPI;
          }

          work.publishers!.push(publisher);
        }
      }
    });

    // Validate work
    if (!work.work_title) {
      work.errors!.push('Work title is required');
    }

    if (work.writers!.length === 0) {
      work.warnings!.push('No writers found for this work');
    }

    // Add warning about missing writer ownership percentages
    if (work.writers!.length > 0) {
      work.warnings!.push('Writer ownership percentages not provided by MLC - defaulted to 0%. Please update manually after import.');
    }

    processed.push(work);
    rowNumber += rows.length;
  });

  console.log(`Processed ${processed.length} works from MLC export`);
  return processed;
}
