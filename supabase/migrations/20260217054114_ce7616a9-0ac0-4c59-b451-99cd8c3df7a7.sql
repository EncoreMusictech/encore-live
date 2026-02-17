-- Schedule daily check for expiring contracts (runs at 9 AM UTC)
SELECT cron.schedule(
  'check-expiring-contracts-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://plxsenykjisqutxcvjeg.supabase.co/functions/v1/check-expiring-contracts',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBseHNlbnlramlzcXV0eGN2amVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0OTQ5OTcsImV4cCI6MjA2ODA3MDk5N30.f-luEprJjlx1sN-siFWgAKlHJ3c1aewKxPqwxIb9gtA"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Schedule daily check for invitation reminders (runs at 10 AM UTC)
SELECT cron.schedule(
  'check-invitation-reminders-daily',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url := 'https://plxsenykjisqutxcvjeg.supabase.co/functions/v1/check-invitation-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBseHNlbnlramlzcXV0eGN2amVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0OTQ5OTcsImV4cCI6MjA2ODA3MDk5N30.f-luEprJjlx1sN-siFWgAKlHJ3c1aewKxPqwxIb9gtA"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);