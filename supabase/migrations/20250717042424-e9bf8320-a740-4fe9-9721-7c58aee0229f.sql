-- Set up cron jobs for automated invitation lifecycle management
-- Run maintenance daily at 2 AM UTC
SELECT cron.schedule(
  'client-invitation-lifecycle-daily',
  '0 2 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://plxsenykjisqutxcvjeg.supabase.co/functions/v1/client-invitation-lifecycle',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBseHNlbnlramlzcXV0eGN2amVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0OTQ5OTcsImV4cCI6MjA2ODA3MDk5N30.f-luEprJjlx1sN-siFWgAKlHJ3c1aewKxPqwxIb9gtA"}'::jsonb,
        body:='{"action": "full_maintenance"}'::jsonb
    ) as request_id;
  $$
);

-- Run reminder checks twice daily at 9 AM and 5 PM UTC
SELECT cron.schedule(
  'client-invitation-reminders',
  '0 9,17 * * *',
  $$
  SELECT
    net.http_post(
        url:='https://plxsenykjisqutxcvjeg.supabase.co/functions/v1/client-invitation-lifecycle',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBseHNlbnlramlzcXV0eGN2amVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0OTQ5OTcsImV4cCI6MjA2ODA3MDk5N30.f-luEprJjlx1sN-siFWgAKlHJ3c1aewKxPqwxIb9gtA"}'::jsonb,
        body:='{"action": "send_reminders"}'::jsonb
    ) as request_id;
  $$
);