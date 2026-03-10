
-- Allow admins to remove other members from a group
DROP POLICY IF EXISTS "gm_delete" ON public.group_members;
CREATE POLICY "gm_delete" ON public.group_members
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
        AND gm.role = 'admin'
    )
  );
