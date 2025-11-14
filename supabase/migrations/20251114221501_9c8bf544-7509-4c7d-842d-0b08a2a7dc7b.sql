-- Cleanup duplicate works from recent upload (last 2 days)
-- Step 1: Delete catalog_items and recordings for duplicate ISRCs (keep earliest by created_at)
WITH recent_copyrights AS (
  SELECT id FROM copyrights WHERE created_at > now() - interval '2 days'
),
recent_recordings AS (
  SELECT r.*, ROW_NUMBER() OVER (
    PARTITION BY lower(trim(r.isrc)) 
    ORDER BY r.created_at ASC, r.id ASC
  ) AS rn
  FROM copyright_recordings r
  JOIN recent_copyrights rc ON rc.id = r.copyright_id
  WHERE r.isrc IS NOT NULL AND trim(r.isrc) <> ''
),
isrc_dups_to_delete AS (
  SELECT id AS recording_id, copyright_id
  FROM recent_recordings
  WHERE rn > 1
)
DELETE FROM catalog_items ci
WHERE (ci.metadata->>'copyright_id')::uuid IN (
  SELECT copyright_id FROM isrc_dups_to_delete
);

-- Delete duplicate ISRC recordings
WITH recent_copyrights AS (
  SELECT id FROM copyrights WHERE created_at > now() - interval '2 days'
),
recent_recordings AS (
  SELECT r.*, ROW_NUMBER() OVER (
    PARTITION BY lower(trim(r.isrc)) 
    ORDER BY r.created_at ASC, r.id ASC
  ) AS rn
  FROM copyright_recordings r
  JOIN recent_copyrights rc ON rc.id = r.copyright_id
  WHERE r.isrc IS NOT NULL AND trim(r.isrc) <> ''
),
isrc_dups_to_delete AS (
  SELECT id AS recording_id
  FROM recent_recordings
  WHERE rn > 1
)
DELETE FROM copyright_recordings
WHERE id IN (SELECT recording_id FROM isrc_dups_to_delete);

-- Step 2: Delete catalog_items for duplicate title+work_type copyrights
WITH recent AS (
  SELECT * FROM copyrights WHERE created_at > now() - interval '2 days'
),
rec_counts AS (
  SELECT c.id, COUNT(r.id) AS recordings
  FROM recent c
  LEFT JOIN copyright_recordings r ON r.copyright_id = c.id
  GROUP BY c.id
),
dup_groups AS (
  SELECT lower(trim(work_title)) AS title_norm, coalesce(work_type,'') AS work_type
  FROM recent
  GROUP BY 1,2
  HAVING COUNT(*) > 1
),
ranked AS (
  SELECT c.id, 
         ROW_NUMBER() OVER (
           PARTITION BY lower(trim(c.work_title)), coalesce(c.work_type,'')
           ORDER BY rc.recordings DESC, c.created_at ASC, c.id ASC
         ) AS rn
  FROM recent c
  JOIN dup_groups d ON lower(trim(c.work_title)) = d.title_norm 
                   AND coalesce(c.work_type,'') = d.work_type
  JOIN rec_counts rc ON rc.id = c.id
),
title_dups_to_delete AS (
  SELECT id FROM ranked WHERE rn > 1
)
DELETE FROM catalog_items ci
WHERE (ci.metadata->>'copyright_id')::uuid IN (
  SELECT id FROM title_dups_to_delete
);

-- Delete recordings for duplicate title+work_type copyrights
WITH recent AS (
  SELECT * FROM copyrights WHERE created_at > now() - interval '2 days'
),
rec_counts AS (
  SELECT c.id, COUNT(r.id) AS recordings
  FROM recent c
  LEFT JOIN copyright_recordings r ON r.copyright_id = c.id
  GROUP BY c.id
),
dup_groups AS (
  SELECT lower(trim(work_title)) AS title_norm, coalesce(work_type,'') AS work_type
  FROM recent
  GROUP BY 1,2
  HAVING COUNT(*) > 1
),
ranked AS (
  SELECT c.id, 
         ROW_NUMBER() OVER (
           PARTITION BY lower(trim(c.work_title)), coalesce(c.work_type,'')
           ORDER BY rc.recordings DESC, c.created_at ASC, c.id ASC
         ) AS rn
  FROM recent c
  JOIN dup_groups d ON lower(trim(c.work_title)) = d.title_norm 
                   AND coalesce(c.work_type,'') = d.work_type
  JOIN rec_counts rc ON rc.id = c.id
),
title_dups_to_delete AS (
  SELECT id FROM ranked WHERE rn > 1
)
DELETE FROM copyright_recordings
WHERE copyright_id IN (SELECT id FROM title_dups_to_delete);

-- Finally, delete the duplicate copyright records themselves
WITH recent AS (
  SELECT * FROM copyrights WHERE created_at > now() - interval '2 days'
),
rec_counts AS (
  SELECT c.id, COUNT(r.id) AS recordings
  FROM recent c
  LEFT JOIN copyright_recordings r ON r.copyright_id = c.id
  GROUP BY c.id
),
dup_groups AS (
  SELECT lower(trim(work_title)) AS title_norm, coalesce(work_type,'') AS work_type
  FROM recent
  GROUP BY 1,2
  HAVING COUNT(*) > 1
),
ranked AS (
  SELECT c.id, 
         ROW_NUMBER() OVER (
           PARTITION BY lower(trim(c.work_title)), coalesce(c.work_type,'')
           ORDER BY rc.recordings DESC, c.created_at ASC, c.id ASC
         ) AS rn
  FROM recent c
  JOIN dup_groups d ON lower(trim(c.work_title)) = d.title_norm 
                   AND coalesce(c.work_type,'') = d.work_type
  JOIN rec_counts rc ON rc.id = c.id
)
DELETE FROM copyrights
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);