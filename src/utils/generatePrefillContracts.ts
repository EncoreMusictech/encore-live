import * as XLSX from 'xlsx';

interface PrefillRow {
  title: string;
  counterparty_name: string;
  contract_type: string;
  start_date: string;
  end_date: string;
  post_term_collection_end_date: string;
  post_term_collection_months: number;
  advance_amount: number;
  commission_percentage: string;
  territories: string;
  party_name: string;
  party_type: string;
  performance_pct: number;
  mechanical_pct: number;
  synch_pct: number;
  work_title: string;
  work_isrc: string;
  publishing_entity: string;
  administrator: string;
  original_publisher: string;
}

function makeAndrewsRow(workTitle: string): PrefillRow {
  return {
    title: 'Co-Publishing Agreement - Nosakhere Jabili Andrews',
    counterparty_name: 'Nosakhere Jabili Andrews',
    contract_type: 'publishing',
    start_date: '2019-01-01',
    end_date: '2022-01-01',
    post_term_collection_end_date: '2024-01-01',
    post_term_collection_months: 24,
    advance_amount: 50000,
    commission_percentage: '',
    territories: 'Universe',
    party_name: 'Nosakhere Jabili Andrews',
    party_type: 'writer',
    performance_pct: 50,
    mechanical_pct: 50,
    synch_pct: 50,
    work_title: workTitle,
    work_isrc: '',
    publishing_entity: '',
    administrator: 'Gray State Music, L.L.C.',
    original_publisher: 'Gray State Music, L.L.C.',
  };
}

function makeDreamAddixRow(workTitle: string, partyName: string): PrefillRow {
  return {
    title: 'Co-Publishing Agreement - Dream Addix',
    counterparty_name: 'Dream Addix',
    contract_type: 'publishing',
    start_date: '2018-09-05',
    end_date: '2021-09-05',
    post_term_collection_end_date: '2023-09-05',
    post_term_collection_months: 24,
    advance_amount: 100000,
    commission_percentage: '',
    territories: 'Universe',
    party_name: partyName,
    party_type: 'writer',
    performance_pct: 10,
    mechanical_pct: 10,
    synch_pct: 10,
    work_title: workTitle,
    work_isrc: '',
    publishing_entity: '',
    administrator: 'Gray State Music, L.L.C.',
    original_publisher: 'Gray State Music, L.L.C.',
  };
}

const ANDREWS_WORKS = [
  'Walked In',
  'El Chapo Jr.',
  'Ghetto',
  'Iced Out',
  'Back',
  'Habit',
  'White Balenciaga',
  'Crazy Shit',
];

const DREAM_ADDIX_WORKS = [
  'Every Night Sis',
  'God Church',
  'Frick Da Police',
  'Bitcoin',
  'Naughty or Nice (Xmas Song)',
];

const DREAM_ADDIX_WRITERS = [
  'Christopher Roen Valenzuela',
  'Michael Paul Ferrucci',
];

export function downloadPrefilledContracts() {
  const rows: PrefillRow[] = [];

  // Andrews: 8 works × 1 writer = 8 rows
  for (const work of ANDREWS_WORKS) {
    rows.push(makeAndrewsRow(work));
  }

  // Dream Addix: 5 works × 2 writers = 10 rows
  for (const work of DREAM_ADDIX_WORKS) {
    for (const writer of DREAM_ADDIX_WRITERS) {
      rows.push(makeDreamAddixRow(work, writer));
    }
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pre-filled Contracts');
  ws['!cols'] = [
    { wch: 45 }, { wch: 28 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
    { wch: 25 }, { wch: 22 }, { wch: 15 }, { wch: 18 }, { wch: 12 },
    { wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 12 },
    { wch: 28 }, { wch: 16 }, { wch: 22 }, { wch: 25 }, { wch: 25 },
  ];
  XLSX.writeFile(wb, 'prefilled-contracts-andrews-dreamaddix.xlsx');
}
