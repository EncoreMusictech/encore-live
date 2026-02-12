// Catalog Import Center - Validation & Normalization Utilities

export interface StagingRow {
  source_sheet: string;
  work_title: string;
  artist_name: string;
  isrc: string | null;
  iswc: string | null;
  normalized_title: string;
  writers: ContributorEntry[];
  publishers: ContributorEntry[];
  canonical_row: Record<string, unknown>;
  identifier_conflicts: IdentifierConflict[];
  validation_status: 'valid' | 'duplicate' | 'error';
  validation_errors: string[];
  raw_row_data: Record<string, unknown>;
}

export interface ContributorEntry {
  name: string;
  ipi?: string;
  role?: string;
  pro?: string;
  share?: number;
}

export interface IdentifierConflict {
  field: string;
  values: { source: string; value: string }[];
}

export interface SheetDetectionResult {
  sheetName: string;
  sheetType: SheetType;
  headers: string[];
  rowCount: number;
  rows: Record<string, unknown>[];
}

export type SheetType =
  | 'musicbrainz_works'
  | 'musicbrainz_recordings'
  | 'ascap_bmi_songview'
  | 'mlc_catalog'
  | 'sync'
  | 'unknown';

// ── Normalization ──────────────────────────────────────────────

export function normalizeTitle(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/\(.*?\)/g, '')       // strip parentheticals
    .replace(/[^\w\s]/g, '')       // strip punctuation
    .replace(/\s+/g, ' ')         // collapse whitespace
    .trim();
}

// ── Identifier Validation ──────────────────────────────────────

const ISRC_REGEX = /^[A-Z]{2}-?[A-Z0-9]{3}-?\d{2}-?\d{5}$/;
const ISWC_REGEX = /^T-?\d{9}-?\d$/;

export function validateISRC(isrc: string | null | undefined): boolean {
  if (!isrc) return false;
  return ISRC_REGEX.test(isrc.trim().toUpperCase());
}

export function validateISWC(iswc: string | null | undefined): boolean {
  if (!iswc) return false;
  return ISWC_REGEX.test(iswc.trim().toUpperCase());
}

export function cleanISRC(isrc: string): string {
  return isrc.trim().toUpperCase().replace(/-/g, '');
}

export function cleanISWC(iswc: string): string {
  return iswc.trim().toUpperCase();
}

// ── Sheet Type Detection ───────────────────────────────────────

const SHEET_PATTERNS: Record<SheetType, string[]> = {
  musicbrainz_works: ['musicbrainz', 'works', 'mb works'],
  musicbrainz_recordings: ['recordings', 'mb recordings'],
  ascap_bmi_songview: ['ascap', 'bmi', 'songview'],
  mlc_catalog: ['mlc', 'mechanical licensing'],
  sync: ['sync', 'tv', 'movie', 'game', 'film'],
  unknown: [],
};

const HEADER_SIGNATURES: Record<SheetType, string[]> = {
  musicbrainz_works: ['mbid', 'work name', 'iswc', 'composer'],
  musicbrainz_recordings: ['isrc', 'recording', 'artist', 'duration'],
  ascap_bmi_songview: ['work id', 'work title', 'writer', 'publisher', 'share'],
  mlc_catalog: ['song code', 'song title', 'iswc', 'isrc'],
  sync: ['sync type', 'media title', 'usage', 'year'],
  unknown: [],
};

export function detectSheetType(sheetName: string, headers: string[]): SheetType {
  const nameLower = sheetName.toLowerCase();
  const headersLower = headers.map(h => (h || '').toLowerCase());

  // Try name-based detection first
  for (const [type, patterns] of Object.entries(SHEET_PATTERNS) as [SheetType, string[]][]) {
    if (type === 'unknown') continue;
    if (patterns.some(p => nameLower.includes(p))) return type;
  }

  // Fall back to header-based detection
  for (const [type, sigs] of Object.entries(HEADER_SIGNATURES) as [SheetType, string[]][]) {
    if (type === 'unknown') continue;
    const matchCount = sigs.filter(sig =>
      headersLower.some(h => h.includes(sig))
    ).length;
    if (matchCount >= 2) return type;
  }

  return 'unknown';
}

// ── Sheet Parsers ──────────────────────────────────────────────

function findHeader(headers: string[], ...candidates: string[]): number {
  const headersLower = headers.map(h => (h || '').toLowerCase().trim());
  for (const c of candidates) {
    const idx = headersLower.findIndex(h => h.includes(c.toLowerCase()));
    if (idx >= 0) return idx;
  }
  return -1;
}

function getVal(row: Record<string, unknown>, headers: string[], ...candidates: string[]): string {
  const idx = findHeader(headers, ...candidates);
  if (idx < 0) return '';
  const key = headers[idx];
  const val = row[key];
  return val != null ? String(val).trim() : '';
}

export function parseSheetRow(
  sheetType: SheetType,
  row: Record<string, unknown>,
  headers: string[]
): Partial<StagingRow> {
  switch (sheetType) {
    case 'musicbrainz_works':
      return parseMusicBrainzWorks(row, headers);
    case 'musicbrainz_recordings':
      return parseMusicBrainzRecordings(row, headers);
    case 'ascap_bmi_songview':
      return parseASCAPBMI(row, headers);
    case 'mlc_catalog':
      return parseMLC(row, headers);
    case 'sync':
      return parseSync(row, headers);
    default:
      return parseGeneric(row, headers);
  }
}

function parseMusicBrainzWorks(row: Record<string, unknown>, headers: string[]): Partial<StagingRow> {
  const title = getVal(row, headers, 'work name', 'title', 'work title');
  const iswc = getVal(row, headers, 'iswc');
  const composer = getVal(row, headers, 'composer', 'writer', 'creator');
  const mbid = getVal(row, headers, 'mbid', 'musicbrainz id');

  const writers: ContributorEntry[] = composer
    ? composer.split(/[,;&]/).map(n => ({ name: n.trim(), role: 'composer' })).filter(w => w.name)
    : [];

  return {
    source_sheet: 'musicbrainz_works',
    work_title: title,
    artist_name: getVal(row, headers, 'artist', 'performer'),
    iswc: validateISWC(iswc) ? cleanISWC(iswc) : iswc || null,
    isrc: null,
    writers,
    publishers: [],
    canonical_row: { musicbrainz_id: mbid || undefined },
    raw_row_data: row,
  };
}

function parseMusicBrainzRecordings(row: Record<string, unknown>, headers: string[]): Partial<StagingRow> {
  const title = getVal(row, headers, 'recording', 'title', 'track');
  const isrc = getVal(row, headers, 'isrc');
  const artist = getVal(row, headers, 'artist', 'performer');

  return {
    source_sheet: 'musicbrainz_recordings',
    work_title: title,
    artist_name: artist,
    isrc: validateISRC(isrc) ? cleanISRC(isrc) : isrc || null,
    iswc: null,
    writers: [],
    publishers: [],
    canonical_row: {},
    raw_row_data: row,
  };
}

function parseASCAPBMI(row: Record<string, unknown>, headers: string[]): Partial<StagingRow> {
  const title = getVal(row, headers, 'work title', 'title', 'song title');
  const workId = getVal(row, headers, 'work id', 'work #');
  const writerName = getVal(row, headers, 'writer', 'writer name');
  const publisherName = getVal(row, headers, 'publisher', 'publisher name');
  const shareStr = getVal(row, headers, 'share', 'ownership', '%');
  const pro = getVal(row, headers, 'pro', 'society');
  const ipi = getVal(row, headers, 'ipi', 'cae');

  const writers: ContributorEntry[] = writerName
    ? [{ name: writerName, ipi: ipi || undefined, pro: pro || undefined, share: parseFloat(shareStr) || undefined, role: 'writer' }]
    : [];

  const publishers: ContributorEntry[] = publisherName
    ? [{ name: publisherName, role: 'publisher' }]
    : [];

  const canonicalRow: Record<string, unknown> = {};
  if (pro?.toLowerCase().includes('ascap')) canonicalRow.ascap_work_id = workId;
  else if (pro?.toLowerCase().includes('bmi')) canonicalRow.bmi_work_id = workId;
  if (pro) canonicalRow.pro_registrations = [{ pro, work_id: workId, status: 'registered' }];

  return {
    source_sheet: 'ascap_bmi_songview',
    work_title: title,
    artist_name: getVal(row, headers, 'artist', 'performer'),
    isrc: null,
    iswc: null,
    writers,
    publishers,
    canonical_row: canonicalRow,
    raw_row_data: row,
  };
}

function parseMLC(row: Record<string, unknown>, headers: string[]): Partial<StagingRow> {
  const title = getVal(row, headers, 'song title', 'title', 'work title');
  const songCode = getVal(row, headers, 'song code', 'mlc id');
  const iswc = getVal(row, headers, 'iswc');
  const isrc = getVal(row, headers, 'isrc');
  const writerName = getVal(row, headers, 'writer', 'songwriter');
  const publisherName = getVal(row, headers, 'publisher');

  const writers: ContributorEntry[] = writerName
    ? writerName.split(/[,;&]/).map(n => ({ name: n.trim(), role: 'writer' })).filter(w => w.name)
    : [];

  const publishers: ContributorEntry[] = publisherName
    ? publisherName.split(/[,;&]/).map(n => ({ name: n.trim(), role: 'publisher' })).filter(p => p.name)
    : [];

  return {
    source_sheet: 'mlc_catalog',
    work_title: title,
    artist_name: getVal(row, headers, 'artist', 'performer'),
    isrc: validateISRC(isrc) ? cleanISRC(isrc) : isrc || null,
    iswc: validateISWC(iswc) ? cleanISWC(iswc) : iswc || null,
    writers,
    publishers,
    canonical_row: { mlc_work_id: songCode || undefined },
    raw_row_data: row,
  };
}

function parseSync(row: Record<string, unknown>, headers: string[]): Partial<StagingRow> {
  const title = getVal(row, headers, 'work title', 'song title', 'title');
  const syncType = getVal(row, headers, 'sync type', 'type', 'usage type');
  const mediaTitle = getVal(row, headers, 'media title', 'show', 'movie', 'game');
  const year = getVal(row, headers, 'year', 'air date', 'release year');

  return {
    source_sheet: 'sync',
    work_title: title,
    artist_name: getVal(row, headers, 'artist', 'performer'),
    isrc: null,
    iswc: null,
    writers: [],
    publishers: [],
    canonical_row: {
      sync_history: [{ type: syncType, title: mediaTitle, year: year || undefined }],
    },
    raw_row_data: row,
  };
}

function parseGeneric(row: Record<string, unknown>, headers: string[]): Partial<StagingRow> {
  const title = getVal(row, headers, 'title', 'work title', 'song title', 'track');
  const artist = getVal(row, headers, 'artist', 'performer');
  const isrc = getVal(row, headers, 'isrc');
  const iswc = getVal(row, headers, 'iswc');

  return {
    source_sheet: 'unknown',
    work_title: title,
    artist_name: artist,
    isrc: isrc || null,
    iswc: iswc || null,
    writers: [],
    publishers: [],
    canonical_row: {},
    raw_row_data: row,
  };
}

// ── Validation Pipeline ────────────────────────────────────────

export function validateStagingRow(row: Partial<StagingRow>): { status: 'valid' | 'error'; errors: string[] } {
  const errors: string[] = [];

  if (!row.work_title?.trim()) {
    errors.push('Missing work title');
  }

  if (row.isrc && !validateISRC(row.isrc)) {
    errors.push(`Invalid ISRC format: ${row.isrc}`);
  }

  if (row.iswc && !validateISWC(row.iswc)) {
    errors.push(`Invalid ISWC format: ${row.iswc}`);
  }

  // Must have at least title — identifiers are optional but validated if present
  if (!row.work_title?.trim() && !row.isrc && !row.iswc) {
    errors.push('Row must have at least a work title or valid identifier');
  }

  return {
    status: errors.length > 0 ? 'error' : 'valid',
    errors,
  };
}

// ── Conflict Detection ─────────────────────────────────────────

export function detectConflicts(rows: StagingRow[]): StagingRow[] {
  const groups = new Map<string, StagingRow[]>();

  // Group by normalized_title + artist
  for (const row of rows) {
    const key = `${row.normalized_title}||${(row.artist_name || '').toLowerCase().trim()}`;
    const group = groups.get(key) || [];
    group.push(row);
    groups.set(key, group);
  }

  // Check for identifier mismatches within groups
  for (const [, group] of groups) {
    if (group.length < 2) continue;

    const iswcValues = group
      .filter(r => r.iswc)
      .map(r => ({ source: r.source_sheet, value: r.iswc! }));

    const uniqueIswcs = new Set(iswcValues.map(v => v.value));
    if (uniqueIswcs.size > 1) {
      const conflict: IdentifierConflict = { field: 'iswc', values: iswcValues };
      for (const row of group) {
        row.identifier_conflicts = [...(row.identifier_conflicts || []), conflict];
        row.validation_status = 'error';
        row.validation_errors = [...(row.validation_errors || []), 'ISWC conflict across sources'];
      }
    }
  }

  return rows;
}
