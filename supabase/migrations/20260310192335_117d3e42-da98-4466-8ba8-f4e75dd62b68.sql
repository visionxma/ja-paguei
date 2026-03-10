
-- Drop triggers that were partially created and recreate cleanly
-- The auth trigger already exists, so skip it. The others from the failed migration may or may not exist.

-- Use IF NOT EXISTS pattern via DO blocks
DO $$ BEGIN
  -- Check and create each trigger only if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_generate_next_recurring_bill') THEN
    CREATE TRIGGER trg_generate_next_recurring_bill
      AFTER UPDATE ON public.bills FOR EACH ROW
      EXECUTE FUNCTION public.generate_next_recurring_bill();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_log_bill_status_change') THEN
    CREATE TRIGGER trg_log_bill_status_change
      AFTER UPDATE ON public.bills FOR EACH ROW
      EXECUTE FUNCTION public.log_bill_status_change();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_notify_group_bill_created') THEN
    CREATE TRIGGER trg_notify_group_bill_created
      AFTER INSERT ON public.bills FOR EACH ROW
      EXECUTE FUNCTION public.notify_group_bill_created();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_notify_group_bill_paid') THEN
    CREATE TRIGGER trg_notify_group_bill_paid
      AFTER UPDATE ON public.bills FOR EACH ROW
      EXECUTE FUNCTION public.notify_group_bill_paid();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_notify_group_new_member') THEN
    CREATE TRIGGER trg_notify_group_new_member
      AFTER INSERT ON public.group_members FOR EACH ROW
      EXECUTE FUNCTION public.notify_group_new_member();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_bills_updated_at') THEN
    CREATE TRIGGER trg_bills_updated_at
      BEFORE UPDATE ON public.bills FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_groups_updated_at') THEN
    CREATE TRIGGER trg_groups_updated_at
      BEFORE UPDATE ON public.groups FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_budget_goals_updated_at') THEN
    CREATE TRIGGER trg_budget_goals_updated_at
      BEFORE UPDATE ON public.budget_goals FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_handle_new_group') THEN
    CREATE TRIGGER trg_handle_new_group
      AFTER INSERT ON public.groups FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_group();
  END IF;
END $$;
