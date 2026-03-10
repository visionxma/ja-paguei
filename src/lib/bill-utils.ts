import type { Tables } from '@/integrations/supabase/types';
import type { Bill } from '@/types/finance';

/** DB row type for bills */
export type BillRow = Tables<'bills'>;

/** Convert a Supabase bill row to a BillCard-compatible object */
export function toBillCard(bill: BillRow): Bill & { dueDate?: string; paidAt?: string; createdAt: string } {
  return {
    id: bill.id,
    description: bill.description,
    amount: Number(bill.amount),
    category: bill.category as Bill['category'],
    status: bill.status as Bill['status'],
    recurrence: bill.recurrence as Bill['recurrence'],
    createdAt: bill.created_at,
    dueDate: bill.due_date || undefined,
    paidAt: bill.paid_at || undefined,
    startDate: bill.start_date || undefined,
    notes: bill.notes || undefined,
    groupId: bill.group_id || undefined,
    responsibleId: bill.responsible_id || undefined,
  };
}

/** Build monthly aggregation data from bills */
export function buildMonthlyData(bills: BillRow[]) {
  const monthMap = new Map<string, { month: string; total: number; paid: number; pending: number }>();
  bills.forEach(b => {
    const dateStr = b.due_date || b.created_at;
    if (!dateStr) return;
    const d = new Date(dateStr);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    if (!monthMap.has(key)) {
      monthMap.set(key, { month: label.charAt(0).toUpperCase() + label.slice(1), total: 0, paid: 0, pending: 0 });
    }
    const entry = monthMap.get(key)!;
    const amount = Number(b.amount);
    entry.total += amount;
    if (b.status === 'pago') entry.paid += amount;
    else entry.pending += amount;
  });
  return Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => v);
}
