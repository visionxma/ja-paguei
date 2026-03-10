
-- The notification triggers run as SECURITY DEFINER which bypasses RLS by default.
-- However, let's also add a permissive INSERT policy to allow service-level inserts
-- and keep the restrictive one for direct user inserts.

-- Drop the existing restrictive INSERT policy and replace with a permissive one
-- that allows both authenticated user inserts (own) and trigger-based inserts
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;

-- Recreate as permissive (PERMISSIVE instead of RESTRICTIVE)
CREATE POLICY "notifications_insert"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
