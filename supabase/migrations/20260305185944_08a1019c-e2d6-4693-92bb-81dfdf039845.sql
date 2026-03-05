
-- Create user_preferences table
CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  -- Notification preferences
  notify_due_1day boolean NOT NULL DEFAULT true,
  notify_due_3days boolean NOT NULL DEFAULT false,
  notify_due_7days boolean NOT NULL DEFAULT false,
  notify_overdue boolean NOT NULL DEFAULT true,
  notify_group_new_bill boolean NOT NULL DEFAULT true,
  notify_group_bill_changed boolean NOT NULL DEFAULT true,
  notify_group_new_member boolean NOT NULL DEFAULT true,
  notify_group_bill_paid boolean NOT NULL DEFAULT true,
  -- Settings preferences
  theme text NOT NULL DEFAULT 'dark',
  currency text NOT NULL DEFAULT 'BRL',
  date_format text NOT NULL DEFAULT 'DD/MM/YYYY',
  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Permissive policies
CREATE POLICY "prefs_select" ON public.user_preferences FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "prefs_insert" ON public.user_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "prefs_update" ON public.user_preferences FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
