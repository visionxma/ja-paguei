
-- Fix ALL restrictive policies to be permissive

-- bills
DROP POLICY IF EXISTS "bills_select" ON public.bills;
DROP POLICY IF EXISTS "bills_insert" ON public.bills;
DROP POLICY IF EXISTS "bills_update" ON public.bills;
DROP POLICY IF EXISTS "bills_delete" ON public.bills;

CREATE POLICY "bills_select" ON public.bills FOR SELECT TO authenticated
  USING (((group_id IS NULL) AND (auth.uid() = user_id)) OR ((group_id IS NOT NULL) AND is_group_member(group_id)));
CREATE POLICY "bills_insert" ON public.bills FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = user_id) AND ((group_id IS NULL) OR is_group_member(group_id)));
CREATE POLICY "bills_update" ON public.bills FOR UPDATE TO authenticated
  USING (((group_id IS NULL) AND (auth.uid() = user_id)) OR ((group_id IS NOT NULL) AND is_group_member(group_id)));
CREATE POLICY "bills_delete" ON public.bills FOR DELETE TO authenticated
  USING (((group_id IS NULL) AND (auth.uid() = user_id)) OR ((group_id IS NOT NULL) AND is_group_member(group_id)));

-- bill_splits
DROP POLICY IF EXISTS "splits_select" ON public.bill_splits;
DROP POLICY IF EXISTS "splits_insert" ON public.bill_splits;
DROP POLICY IF EXISTS "splits_update" ON public.bill_splits;
DROP POLICY IF EXISTS "splits_delete" ON public.bill_splits;

CREATE POLICY "splits_select" ON public.bill_splits FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM bills b WHERE b.id = bill_splits.bill_id AND (((b.group_id IS NULL) AND (auth.uid() = b.user_id)) OR ((b.group_id IS NOT NULL) AND is_group_member(b.group_id)))));
CREATE POLICY "splits_insert" ON public.bill_splits FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM bills b WHERE b.id = bill_splits.bill_id AND (((b.group_id IS NULL) AND (auth.uid() = b.user_id)) OR ((b.group_id IS NOT NULL) AND is_group_member(b.group_id)))));
CREATE POLICY "splits_update" ON public.bill_splits FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM bills b WHERE b.id = bill_splits.bill_id AND (((b.group_id IS NULL) AND (auth.uid() = b.user_id)) OR ((b.group_id IS NOT NULL) AND is_group_member(b.group_id)))));
CREATE POLICY "splits_delete" ON public.bill_splits FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM bills b WHERE b.id = bill_splits.bill_id AND (((b.group_id IS NULL) AND (auth.uid() = b.user_id)) OR ((b.group_id IS NOT NULL) AND is_group_member(b.group_id)))));

-- bill_attachments
DROP POLICY IF EXISTS "attach_select" ON public.bill_attachments;
DROP POLICY IF EXISTS "attach_insert" ON public.bill_attachments;
DROP POLICY IF EXISTS "attach_delete" ON public.bill_attachments;

CREATE POLICY "attach_select" ON public.bill_attachments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM bills b WHERE b.id = bill_attachments.bill_id AND (((b.group_id IS NULL) AND (auth.uid() = b.user_id)) OR ((b.group_id IS NOT NULL) AND is_group_member(b.group_id)))));
CREATE POLICY "attach_insert" ON public.bill_attachments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);
CREATE POLICY "attach_delete" ON public.bill_attachments FOR DELETE TO authenticated
  USING (auth.uid() = uploaded_by);

-- group_members
DROP POLICY IF EXISTS "gm_select" ON public.group_members;
DROP POLICY IF EXISTS "gm_insert" ON public.group_members;
DROP POLICY IF EXISTS "gm_delete" ON public.group_members;

CREATE POLICY "gm_select" ON public.group_members FOR SELECT TO authenticated
  USING (is_group_member(group_id));
CREATE POLICY "gm_insert" ON public.group_members FOR INSERT TO authenticated
  WITH CHECK (is_group_member(group_id) OR (auth.uid() = user_id));
CREATE POLICY "gm_delete" ON public.group_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- group_invites
DROP POLICY IF EXISTS "invites_select" ON public.group_invites;
DROP POLICY IF EXISTS "invites_insert" ON public.group_invites;
DROP POLICY IF EXISTS "invites_update" ON public.group_invites;
DROP POLICY IF EXISTS "invites_delete" ON public.group_invites;

CREATE POLICY "invites_select" ON public.group_invites FOR SELECT TO authenticated
  USING (is_group_member(group_id));
CREATE POLICY "invites_insert" ON public.group_invites FOR INSERT TO authenticated
  WITH CHECK (is_group_member(group_id));
CREATE POLICY "invites_update" ON public.group_invites FOR UPDATE TO authenticated
  USING (email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text);
CREATE POLICY "invites_delete" ON public.group_invites FOR DELETE TO authenticated
  USING (is_group_member(group_id));

-- groups
DROP POLICY IF EXISTS "groups_select_member" ON public.groups;
DROP POLICY IF EXISTS "groups_select_creator" ON public.groups;
DROP POLICY IF EXISTS "groups_insert" ON public.groups;
DROP POLICY IF EXISTS "groups_update" ON public.groups;
DROP POLICY IF EXISTS "groups_delete" ON public.groups;

CREATE POLICY "groups_select_member" ON public.groups FOR SELECT TO authenticated
  USING (is_group_member(id));
CREATE POLICY "groups_select_creator" ON public.groups FOR SELECT TO authenticated
  USING (auth.uid() = created_by);
CREATE POLICY "groups_insert" ON public.groups FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "groups_update" ON public.groups FOR UPDATE TO authenticated
  USING (is_group_member(id));
CREATE POLICY "groups_delete" ON public.groups FOR DELETE TO authenticated
  USING (auth.uid() = created_by);

-- profiles
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_group" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "profiles_select_group" ON public.profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM group_members gm1 JOIN group_members gm2 ON gm1.group_id = gm2.group_id WHERE gm1.user_id = auth.uid() AND gm2.user_id = profiles.user_id));
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Recreate trigger for groups (ensure it exists)
DROP TRIGGER IF EXISTS on_group_created ON public.groups;
CREATE TRIGGER on_group_created
  AFTER INSERT ON public.groups
  FOR EACH ROW EXECUTE FUNCTION handle_new_group();
