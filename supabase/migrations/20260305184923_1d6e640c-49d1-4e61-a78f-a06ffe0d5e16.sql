
-- =============================================
-- FIX: Change ALL RLS policies from RESTRICTIVE to PERMISSIVE
-- and recreate the missing on_group_created trigger
-- =============================================

-- 1. DROP ALL EXISTING POLICIES
-- groups
DROP POLICY IF EXISTS "Members can view group" ON public.groups;
DROP POLICY IF EXISTS "Creator can view own group" ON public.groups;
DROP POLICY IF EXISTS "Authenticated can create groups" ON public.groups;
DROP POLICY IF EXISTS "Members can update group" ON public.groups;
DROP POLICY IF EXISTS "Creator can delete group" ON public.groups;

-- group_members
DROP POLICY IF EXISTS "Members can view members" ON public.group_members;
DROP POLICY IF EXISTS "Members can add members" ON public.group_members;
DROP POLICY IF EXISTS "Members can remove themselves" ON public.group_members;

-- bills
DROP POLICY IF EXISTS "Users can view own bills" ON public.bills;
DROP POLICY IF EXISTS "Users can create bills" ON public.bills;
DROP POLICY IF EXISTS "Users can update own bills" ON public.bills;
DROP POLICY IF EXISTS "Users can delete own bills" ON public.bills;

-- bill_splits
DROP POLICY IF EXISTS "Users can view bill splits" ON public.bill_splits;
DROP POLICY IF EXISTS "Users can create bill splits" ON public.bill_splits;
DROP POLICY IF EXISTS "Users can update bill splits" ON public.bill_splits;
DROP POLICY IF EXISTS "Users can delete bill splits" ON public.bill_splits;

-- bill_attachments
DROP POLICY IF EXISTS "Users can view attachments" ON public.bill_attachments;
DROP POLICY IF EXISTS "Users can upload attachments" ON public.bill_attachments;
DROP POLICY IF EXISTS "Users can delete own attachments" ON public.bill_attachments;

-- group_invites
DROP POLICY IF EXISTS "Members can view invites" ON public.group_invites;
DROP POLICY IF EXISTS "Members can create invites" ON public.group_invites;
DROP POLICY IF EXISTS "Invited user can update" ON public.group_invites;
DROP POLICY IF EXISTS "Members can delete invites" ON public.group_invites;

-- profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Group members can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- 2. RECREATE ALL POLICIES AS PERMISSIVE

-- ===== GROUPS =====
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

-- ===== GROUP_MEMBERS =====
CREATE POLICY "gm_select" ON public.group_members FOR SELECT TO authenticated
  USING (is_group_member(group_id));

CREATE POLICY "gm_insert" ON public.group_members FOR INSERT TO authenticated
  WITH CHECK (is_group_member(group_id) OR auth.uid() = user_id);

CREATE POLICY "gm_delete" ON public.group_members FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- ===== BILLS =====
CREATE POLICY "bills_select" ON public.bills FOR SELECT TO authenticated
  USING ((group_id IS NULL AND auth.uid() = user_id) OR (group_id IS NOT NULL AND is_group_member(group_id)));

CREATE POLICY "bills_insert" ON public.bills FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND (group_id IS NULL OR is_group_member(group_id)));

CREATE POLICY "bills_update" ON public.bills FOR UPDATE TO authenticated
  USING ((group_id IS NULL AND auth.uid() = user_id) OR (group_id IS NOT NULL AND is_group_member(group_id)));

CREATE POLICY "bills_delete" ON public.bills FOR DELETE TO authenticated
  USING ((group_id IS NULL AND auth.uid() = user_id) OR (group_id IS NOT NULL AND is_group_member(group_id)));

-- ===== BILL_SPLITS =====
CREATE POLICY "splits_select" ON public.bill_splits FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM bills b WHERE b.id = bill_splits.bill_id AND ((b.group_id IS NULL AND auth.uid() = b.user_id) OR (b.group_id IS NOT NULL AND is_group_member(b.group_id)))));

CREATE POLICY "splits_insert" ON public.bill_splits FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM bills b WHERE b.id = bill_splits.bill_id AND ((b.group_id IS NULL AND auth.uid() = b.user_id) OR (b.group_id IS NOT NULL AND is_group_member(b.group_id)))));

CREATE POLICY "splits_update" ON public.bill_splits FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM bills b WHERE b.id = bill_splits.bill_id AND ((b.group_id IS NULL AND auth.uid() = b.user_id) OR (b.group_id IS NOT NULL AND is_group_member(b.group_id)))));

CREATE POLICY "splits_delete" ON public.bill_splits FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM bills b WHERE b.id = bill_splits.bill_id AND ((b.group_id IS NULL AND auth.uid() = b.user_id) OR (b.group_id IS NOT NULL AND is_group_member(b.group_id)))));

-- ===== BILL_ATTACHMENTS =====
CREATE POLICY "attach_select" ON public.bill_attachments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM bills b WHERE b.id = bill_attachments.bill_id AND ((b.group_id IS NULL AND auth.uid() = b.user_id) OR (b.group_id IS NOT NULL AND is_group_member(b.group_id)))));

CREATE POLICY "attach_insert" ON public.bill_attachments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "attach_delete" ON public.bill_attachments FOR DELETE TO authenticated
  USING (auth.uid() = uploaded_by);

-- ===== GROUP_INVITES =====
CREATE POLICY "invites_select" ON public.group_invites FOR SELECT TO authenticated
  USING (is_group_member(group_id));

CREATE POLICY "invites_insert" ON public.group_invites FOR INSERT TO authenticated
  WITH CHECK (is_group_member(group_id));

CREATE POLICY "invites_update" ON public.group_invites FOR UPDATE TO authenticated
  USING (email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text);

CREATE POLICY "invites_delete" ON public.group_invites FOR DELETE TO authenticated
  USING (is_group_member(group_id));

-- ===== PROFILES =====
CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "profiles_select_group" ON public.profiles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM group_members gm1 JOIN group_members gm2 ON gm1.group_id = gm2.group_id WHERE gm1.user_id = auth.uid() AND gm2.user_id = profiles.user_id));

CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- 3. RECREATE THE TRIGGER for auto-adding creator as admin
DROP TRIGGER IF EXISTS on_group_created ON public.groups;
CREATE TRIGGER on_group_created
  AFTER INSERT ON public.groups
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_group();
