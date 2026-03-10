
-- 1. Budget goals per category
CREATE TABLE public.budget_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category text NOT NULL,
  monthly_limit numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, category)
);

ALTER TABLE public.budget_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_goals_select" ON public.budget_goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "budget_goals_insert" ON public.budget_goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budget_goals_update" ON public.budget_goals FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "budget_goals_delete" ON public.budget_goals FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 2. In-app notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  bill_id uuid REFERENCES public.bills(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. Payment history log
CREATE TABLE public.payment_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid NOT NULL REFERENCES public.bills(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action text NOT NULL,
  old_status text,
  new_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_logs_select" ON public.payment_logs FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM bills b WHERE b.id = payment_logs.bill_id
    AND ((b.group_id IS NULL AND auth.uid() = b.user_id) OR (b.group_id IS NOT NULL AND is_group_member(b.group_id)))
  ));
CREATE POLICY "payment_logs_insert" ON public.payment_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 4. Trigger to auto-log status changes
CREATE OR REPLACE FUNCTION public.log_bill_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.payment_logs (bill_id, user_id, action, old_status, new_status)
    VALUES (NEW.id, auth.uid(), 'status_change', OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_bill_status_change
  AFTER UPDATE ON public.bills
  FOR EACH ROW
  EXECUTE FUNCTION public.log_bill_status_change();

-- 5. Trigger to create notification when a group bill is created
CREATE OR REPLACE FUNCTION public.notify_group_bill_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.group_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, group_id, bill_id)
    SELECT gm.user_id, 'group_bill', 'Nova conta no grupo',
      'Uma nova conta "' || NEW.description || '" foi criada.',
      NEW.group_id, NEW.id
    FROM public.group_members gm
    WHERE gm.group_id = NEW.group_id AND gm.user_id != NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_group_bill_created
  AFTER INSERT ON public.bills
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_group_bill_created();

-- 6. Trigger to notify when a group bill is paid
CREATE OR REPLACE FUNCTION public.notify_group_bill_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.group_id IS NOT NULL AND OLD.status = 'pendente' AND NEW.status = 'pago' THEN
    INSERT INTO public.notifications (user_id, type, title, message, group_id, bill_id)
    SELECT gm.user_id, 'group_paid', 'Conta paga',
      'A conta "' || NEW.description || '" foi marcada como paga.',
      NEW.group_id, NEW.id
    FROM public.group_members gm
    WHERE gm.group_id = NEW.group_id AND gm.user_id != auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_group_bill_paid
  AFTER UPDATE ON public.bills
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_group_bill_paid();

-- 7. Trigger to notify when new member joins a group
CREATE OR REPLACE FUNCTION public.notify_group_new_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, group_id)
  SELECT gm.user_id, 'group_member', 'Novo membro',
    'Um novo membro entrou no grupo.',
    NEW.group_id
  FROM public.group_members gm
  WHERE gm.group_id = NEW.group_id AND gm.user_id != NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_group_new_member
  AFTER INSERT ON public.group_members
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_group_new_member();

-- 8. Function to auto-generate next recurring bill
CREATE OR REPLACE FUNCTION public.generate_next_recurring_bill()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  next_due date;
BEGIN
  IF OLD.status = 'pendente' AND NEW.status = 'pago' AND NEW.recurrence != 'unica' THEN
    IF NEW.due_date IS NOT NULL THEN
      IF NEW.recurrence = 'mensal' THEN
        next_due := NEW.due_date + interval '1 month';
      ELSIF NEW.recurrence = 'anual' THEN
        next_due := NEW.due_date + interval '1 year';
      ELSE
        RETURN NEW;
      END IF;

      INSERT INTO public.bills (user_id, group_id, description, amount, due_date, start_date, category, status, recurrence, notes, responsible_id)
      VALUES (NEW.user_id, NEW.group_id, NEW.description, NEW.amount, next_due, next_due, NEW.category, 'pendente', NEW.recurrence, NEW.notes, NEW.responsible_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_recurring_bill_paid
  AFTER UPDATE ON public.bills
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_next_recurring_bill();
