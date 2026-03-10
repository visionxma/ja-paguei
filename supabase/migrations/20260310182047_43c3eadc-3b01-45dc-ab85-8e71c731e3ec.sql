
-- Allow anyone authenticated to find a group by invite_code (needed for join flow)
CREATE POLICY "groups_select_by_invite_code"
  ON public.groups
  FOR SELECT
  TO authenticated
  USING (invite_code IS NOT NULL);
