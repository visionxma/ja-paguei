
-- Add SELECT policy so creator can always see their own group
-- This fixes the INSERT...RETURNING issue where is_group_member check fails
CREATE POLICY "Creator can view own group" ON public.groups
  FOR SELECT TO authenticated
  USING (auth.uid() = created_by);
