
-- Create bill_splits table
CREATE TABLE public.bill_splits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bill_id uuid NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  percentage numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  weight numeric DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(bill_id, user_id)
);

-- Enable RLS
ALTER TABLE public.bill_splits ENABLE ROW LEVEL SECURITY;

-- RLS: Members can view splits for bills they can see
CREATE POLICY "Users can view bill splits"
  ON public.bill_splits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bills b
      WHERE b.id = bill_splits.bill_id
      AND (
        (b.group_id IS NULL AND auth.uid() = b.user_id)
        OR (b.group_id IS NOT NULL AND is_group_member(b.group_id))
      )
    )
  );

-- RLS: Members can insert splits for group bills they belong to
CREATE POLICY "Users can create bill splits"
  ON public.bill_splits FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bills b
      WHERE b.id = bill_splits.bill_id
      AND (
        (b.group_id IS NULL AND auth.uid() = b.user_id)
        OR (b.group_id IS NOT NULL AND is_group_member(b.group_id))
      )
    )
  );

-- RLS: Members can update splits
CREATE POLICY "Users can update bill splits"
  ON public.bill_splits FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.bills b
      WHERE b.id = bill_splits.bill_id
      AND (
        (b.group_id IS NULL AND auth.uid() = b.user_id)
        OR (b.group_id IS NOT NULL AND is_group_member(b.group_id))
      )
    )
  );

-- RLS: Members can delete splits
CREATE POLICY "Users can delete bill splits"
  ON public.bill_splits FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.bills b
      WHERE b.id = bill_splits.bill_id
      AND (
        (b.group_id IS NULL AND auth.uid() = b.user_id)
        OR (b.group_id IS NOT NULL AND is_group_member(b.group_id))
      )
    )
  );
