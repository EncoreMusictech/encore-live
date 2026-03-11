import { supabase } from '@/integrations/supabase/client';

/** Alicia Keys works with metadata */
const WORKS = [
  { title: 'If I Ain\'t Got You', iswc: 'T-070.342.081-3', album: 'The Diary of Alicia Keys', isrc: 'USJI10400275', duration: 228, coWriters: [] },
  { title: 'No One', iswc: 'T-070.894.512-7', album: 'As I Am', isrc: 'USJI10700131', duration: 254, coWriters: [{ name: 'Kerry Brothers Jr.', pct: 25, pro: 'BMI' }] },
  { title: 'Fallin\'', iswc: 'T-070.112.330-1', album: 'Songs in A Minor', isrc: 'USJI10100219', duration: 211, coWriters: [] },
  { title: 'Girl on Fire', iswc: 'T-071.456.892-5', album: 'Girl on Fire', isrc: 'USRC11201456', duration: 230, coWriters: [{ name: 'Jeff Bhasker', pct: 20, pro: 'ASCAP' }, { name: 'Salaam Remi', pct: 15, pro: 'BMI' }] },
  { title: 'Empire State of Mind (Part II)', iswc: 'T-071.023.445-8', album: 'The Element of Freedom', isrc: 'USJI10900332', duration: 217, coWriters: [{ name: 'Al Shuckburgh', pct: 15, pro: 'PRS' }] },
  { title: 'Unbreakable', iswc: 'T-072.113.667-2', album: 'As I Am', isrc: 'USJI10700145', duration: 262, coWriters: [{ name: 'Kerry Brothers Jr.', pct: 25, pro: 'BMI' }] },
  { title: 'Try Sleeping with a Broken Heart', iswc: 'T-071.567.334-9', album: 'The Element of Freedom', isrc: 'USJI10900340', duration: 245, coWriters: [{ name: 'Jeff Bhasker', pct: 25, pro: 'ASCAP' }] },
  { title: 'Superwoman', iswc: 'T-070.998.221-4', album: 'As I Am', isrc: 'USJI10700160', duration: 268, coWriters: [{ name: 'Steve Mostyn', pct: 20, pro: 'SESAC' }] },
];

export async function seedDemoCopyrights(userId: string): Promise<string[]> {
  // Check if already seeded
  const { count } = await supabase
    .from('copyrights')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .ilike('notes', '%DEMO-AK%');

  if ((count ?? 0) >= 8) {
    // Return existing IDs
    const { data } = await supabase
      .from('copyrights')
      .select('id')
      .eq('user_id', userId)
      .ilike('notes', '%DEMO-AK%')
      .order('work_title');
    return (data ?? []).map(r => r.id);
  }

  // Insert copyrights
  const copyrightInserts = WORKS.map((w, i) => ({
    user_id: userId,
    work_title: w.title,
    iswc: w.iswc,
    isrc: w.isrc,
    album_title: w.album,
    duration_seconds: w.duration,
    work_id: `DEMO-AK-${String(i + 1).padStart(3, '0')}`,
    registration_status: 'registered',
    status: 'active',
    notes: 'DEMO-AK — Alicia Keys demo catalog',
    work_type: 'Musical Work',
    language_code: 'EN',
    rights_types: ['performance', 'mechanical', 'synchronization'],
    collection_territories: ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'JP'],
  }));

  const { data: copyrights, error } = await supabase
    .from('copyrights')
    .insert(copyrightInserts as any)
    .select('id');

  if (error) {
    console.error('Demo copyrights insert error:', error);
    return [];
  }

  const ids = (copyrights ?? []).map(r => r.id);

  // Insert writers for each copyright
  const writerInserts: any[] = [];
  WORKS.forEach((w, i) => {
    if (!ids[i]) return;
    const coWriterTotal = w.coWriters.reduce((sum, cw) => sum + cw.pct, 0);
    const aliciaShare = 100 - coWriterTotal;

    writerInserts.push({
      copyright_id: ids[i],
      writer_name: 'Alicia Keys',
      ownership_percentage: aliciaShare,
      controlled_status: 'C',
      pro_affiliation: 'ASCAP',
      ipi_number: '00349382747',
      writer_role: 'Composer/Author',
      performance_share: aliciaShare,
      mechanical_share: aliciaShare,
      synchronization_share: aliciaShare,
    });

    w.coWriters.forEach(cw => {
      writerInserts.push({
        copyright_id: ids[i],
        writer_name: cw.name,
        ownership_percentage: cw.pct,
        controlled_status: 'C',
        pro_affiliation: cw.pro,
        writer_role: 'Composer/Author',
        performance_share: cw.pct,
        mechanical_share: cw.pct,
        synchronization_share: cw.pct,
      });
    });
  });

  const { error: wrErr } = await supabase.from('copyright_writers').insert(writerInserts);
  if (wrErr) console.error('Demo copyright_writers insert error:', wrErr);

  // Insert recordings
  const recordingInserts = WORKS.map((w, i) => ids[i] ? {
    copyright_id: ids[i],
    recording_title: w.title,
    artist_name: 'Alicia Keys',
    isrc: w.isrc,
    duration_seconds: w.duration,
    label_name: 'J Records / RCA Records',
    release_date: '2004-02-10',
  } : null).filter(Boolean);

  const { error: recErr } = await supabase.from('copyright_recordings').insert(recordingInserts as any);
  if (recErr) console.error('Demo copyright_recordings insert error:', recErr);

  return ids;
}
