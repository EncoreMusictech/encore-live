/**
 * Utility functions for bulk works upload with multi-row grouping support.
 * Handles both flat (one row per work) and PAQ-style (multi-row grouped) formats.
 */

export interface GroupedWriter {
  name: string;
  firstName: string;
  lastName: string;
  ipi: string | null;
  pro: string | null;
  share: number;
  controlled: boolean;
  role: string;
}

export interface GroupedWork {
  title: string;
  alternateTitle: string | null;
  artist: string | null;
  featuredArtist: string | null;
  isrc: string | null;
  iswc: string | null;
  albumTitle: string | null;
  workType: string;
  contentRating: string | null;
  notes: string | null;
  writers: GroupedWriter[];
  /** 1-indexed row numbers from the original spreadsheet */
  sourceRows: number[];
}

// Column name aliases: maps display-friendly PAQ headers to canonical keys
const COLUMN_ALIASES: Record<string, string> = {
  'Work Title': 'work_title',
  'work_title': 'work_title',
  'title': 'work_title',
  'Title': 'work_title',
  'Alternate Title': 'alternate_title',
  'alternate_title': 'alternate_title',
  'Main Artist': 'main_artist',
  'main_artist': 'main_artist',
  'artist': 'main_artist',
  'Artist': 'main_artist',
  'Featured Artist': 'featured_artist',
  'featured_artist': 'featured_artist',
  'ISRC': 'isrc',
  'isrc': 'isrc',
  'recording_isrc': 'isrc',
  'ISWC': 'iswc',
  'iswc': 'iswc',
  'Album Title': 'album_title',
  'album_title': 'album_title',
  'Content (Clean / Explicit / Neither)': 'content_rating',
  'content_rating': 'content_rating',
  'notes': 'notes',
  'Notes': 'notes',
  // Writer columns from PAQ format
  'Name of Writer(s)': 'writer_name',
  'First Name': 'writer_first_name',
  'Last Name': 'writer_last_name',
  'Share': 'writer_share',
  'Controlled (Y/N)': 'writer_controlled',
  'PRO': 'writer_pro',
  'IPI': 'writer_ipi',
  'IPI#': 'writer_ipi',
  'IPI Number': 'writer_ipi',
  'Writer Role': 'writer_role',
  'writer_role': 'writer_role',
};

/** Normalize a raw row's keys using the alias map */
function normalizeRow(raw: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};
  for (const [key, value] of Object.entries(raw)) {
    const trimmedKey = key.trim();
    const canonical = COLUMN_ALIASES[trimmedKey] || trimmedKey;
    normalized[canonical] = value;
  }
  return normalized;
}

/** Check if a row is entirely empty / whitespace */
function isEmptyRow(row: Record<string, any>): boolean {
  return Object.values(row).every(
    v => v === null || v === undefined || String(v).trim() === ''
  );
}

/** Extract writer info from a normalized row */
function extractWriter(row: Record<string, any>): GroupedWriter | null {
  // PAQ-style: writer data in dedicated columns
  const name = str(row.writer_name);
  const firstName = str(row.writer_first_name);
  const lastName = str(row.writer_last_name);

  const fullName = name || [firstName, lastName].filter(Boolean).join(' ');
  if (!fullName) return null;

  const shareRaw = row.writer_share ?? row.writer_1_ownership;
  const shareParsed = parseFloat(String(shareRaw)) || 0;
  const share = (shareParsed > 0 && shareParsed <= 1) ? shareParsed * 100 : shareParsed;

  const controlledRaw = str(row.writer_controlled ?? row.writer_1_controlled);
  const controlled = /^(y|yes|c|true|1)$/i.test(controlledRaw);

  return {
    name: fullName,
    firstName: firstName || '',
    lastName: lastName || '',
    ipi: str(row.writer_ipi ?? row.writer_1_ipi) || null,
    pro: str(row.writer_pro ?? row.writer_1_pro) || null,
    share,
    controlled,
    role: str(row.writer_role) || 'composer',
  };
}

/** Extract inline writers from flat format (writer_1_name, writer_2_name, etc.) */
function extractInlineWriters(row: Record<string, any>): GroupedWriter[] {
  const writers: GroupedWriter[] = [];
  for (let i = 1; i <= 10; i++) {
    const name = str(row[`writer_${i}_name`]);
    if (!name) continue;
    const shareRaw = row[`writer_${i}_ownership`];
    const shareParsed = parseFloat(String(shareRaw)) || 0;
    const shareNormalized = (shareParsed > 0 && shareParsed <= 1) ? shareParsed * 100 : shareParsed;
    const controlledRaw = str(row[`writer_${i}_controlled`]);
    writers.push({
      name,
      firstName: '',
      lastName: '',
      ipi: str(row[`writer_${i}_ipi`]) || null,
      pro: str(row[`writer_${i}_pro`]) || null,
      share: shareNormalized,
      controlled: /^(y|yes|c|true|1)$/i.test(controlledRaw),
      role: str(row[`writer_${i}_role`]) || 'composer',
    });
  }
  return writers;
}

function str(v: any): string {
  if (v === null || v === undefined) return '';
  return String(v).trim();
}

/**
 * Groups flat rows into works, supporting both:
 * - Flat format: every row has a title, writers in writer_N_* columns
 * - PAQ grouped format: first row has title + first writer, continuation rows have blank title + additional writers
 */
export function groupRowsIntoWorks(rawRows: Record<string, any>[]): GroupedWork[] {
  const works: GroupedWork[] = [];
  let currentWork: GroupedWork | null = null;

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i];
    const row = normalizeRow(raw);
    const rowNum = i + 2; // +2 because row 1 is headers, data starts at row 2

    // Skip fully empty rows (separators)
    if (isEmptyRow(row)) {
      continue;
    }

    const title = str(row.work_title);

    if (title) {
      // This is a new work (has a title)
      // Finalize previous work
      if (currentWork) {
        works.push(currentWork);
      }

      const isVideo = /\(video\)/i.test(title);

      currentWork = {
        title,
        alternateTitle: str(row.alternate_title) || null,
        artist: str(row.main_artist) || null,
        featuredArtist: str(row.featured_artist) || null,
        isrc: str(row.isrc) || null,
        iswc: str(row.iswc) || null,
        albumTitle: str(row.album_title) || null,
        workType: isVideo ? 'Video' : 'Audio Recording',
        contentRating: str(row.content_rating) || null,
        notes: str(row.notes) || null,
        writers: [],
        sourceRows: [rowNum],
      };

      // Extract writer from this row (PAQ-style single writer per row)
      const paqWriter = extractWriter(row);
      if (paqWriter) {
        currentWork.writers.push(paqWriter);
      } else {
        // Try inline flat format (writer_1_name, writer_2_name, ...)
        const inlineWriters = extractInlineWriters(row);
        currentWork.writers.push(...inlineWriters);
      }
    } else {
      // Continuation row (no title) — append writer to current work
      if (!currentWork) continue; // orphan row with no preceding work, skip

      currentWork.sourceRows.push(rowNum);
      const writer = extractWriter(row);
      if (writer) {
        currentWork.writers.push(writer);
      }
    }
  }

  // Don't forget the last work
  if (currentWork) {
    works.push(currentWork);
  }

  return works;
}
