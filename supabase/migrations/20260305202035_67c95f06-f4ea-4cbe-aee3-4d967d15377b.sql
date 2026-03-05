
-- Create friends table
CREATE TABLE public.friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (requester_id, receiver_id)
);

-- Enable RLS
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- Security definer function to check friendship involvement
CREATE OR REPLACE FUNCTION public.is_friend_participant(_user_id uuid, _friend_row_requester uuid, _friend_row_receiver uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT _user_id = _friend_row_requester OR _user_id = _friend_row_receiver
$$;

-- SELECT: user can see rows where they are requester or receiver
CREATE POLICY "friends_select" ON public.friends
FOR SELECT TO authenticated
USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- INSERT: user can only send requests as themselves, not to themselves
CREATE POLICY "friends_insert" ON public.friends
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = requester_id AND requester_id != receiver_id);

-- UPDATE: only receiver can accept/reject
CREATE POLICY "friends_update" ON public.friends
FOR UPDATE TO authenticated
USING (auth.uid() = receiver_id);

-- DELETE: either party can remove friendship
CREATE POLICY "friends_delete" ON public.friends
FOR DELETE TO authenticated
USING (auth.uid() = requester_id OR auth.uid() = receiver_id);
