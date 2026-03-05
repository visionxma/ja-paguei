-- Allow authenticated users to read any profile (needed for friend requests, QR code add-friend flow)
CREATE POLICY "profiles_select_authenticated"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Also allow friends to read each other's profiles via the friends table
CREATE POLICY "profiles_select_friends"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.friends f
    WHERE f.status = 'accepted'
      AND (
        (f.requester_id = auth.uid() AND f.receiver_id = profiles.user_id)
        OR (f.receiver_id = auth.uid() AND f.requester_id = profiles.user_id)
      )
  )
);