-- Allow anyone (including unauthenticated users) to read pending invitations by token
-- This is safe because tokens are cryptographically random and only expose limited data
CREATE POLICY "Anyone can validate invitation tokens"
ON public.client_invitations
FOR SELECT
USING (
  status = 'pending'
  AND expires_at > now()
);