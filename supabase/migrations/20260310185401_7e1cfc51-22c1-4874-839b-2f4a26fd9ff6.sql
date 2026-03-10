
-- Fix notifications insert policy to be more specific (allow trigger inserts via SECURITY DEFINER)
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
-- Only allow users to insert notifications for themselves (triggers use SECURITY DEFINER which bypasses RLS)
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
