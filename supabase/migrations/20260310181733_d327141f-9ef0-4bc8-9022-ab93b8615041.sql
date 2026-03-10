
-- Add invite_code to groups for shareable invite links
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS invite_code text UNIQUE DEFAULT encode(gen_random_bytes(12), 'hex');

-- Add admin_only_edit setting to groups (who can edit group info)
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS admin_only_edit boolean NOT NULL DEFAULT true;

-- Allow admins to UPDATE group_members (promote/demote)
CREATE POLICY "gm_update_admin"
  ON public.group_members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.group_members gm
      WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid()
        AND gm.role = 'admin'
    )
  );
