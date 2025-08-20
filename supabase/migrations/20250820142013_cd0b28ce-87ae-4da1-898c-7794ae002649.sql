-- Create client data associations for Janishia Jones's sync licenses
-- Her client_user_id is f8804014-30a0-421c-ac25-3193152960e7
-- Her subscriber is 5f377ef9-10fe-413c-a3db-3a7b1c77ed6b

INSERT INTO client_data_associations (
    subscriber_user_id,
    client_user_id,
    data_type,
    data_id
) VALUES 
-- Silicon Valley sync license where Janishia Jones is controlled writer
(
    '5f377ef9-10fe-413c-a3db-3a7b1c77ed6b',
    'f8804014-30a0-421c-ac25-3193152960e7',
    'sync_license',
    '476a2aa8-9f66-4f85-b653-9ef8a656d936'
),
-- NFL Commercial sync license where Janishia Jones is controlled writer  
(
    '5f377ef9-10fe-413c-a3db-3a7b1c77ed6b',
    'f8804014-30a0-421c-ac25-3193152960e7',
    'sync_license',
    '252a7d90-8ecc-4a3c-ac39-78e11c3e4099'
);