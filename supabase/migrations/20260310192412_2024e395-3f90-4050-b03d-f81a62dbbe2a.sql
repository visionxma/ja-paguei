
-- Fix: restrict notification INSERT to own user_id only (the SECURITY DEFINER triggers bypass RLS anyway)
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;

CREATE POLICY "notifications_insert"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
