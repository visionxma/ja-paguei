import { useMemo } from 'react';
import { ArrowRight, Scale } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFormat } from '@/contexts/FormatContext';
import UserAvatar from '@/components/UserAvatar';

interface Member {
  id: string;
  user_id: string;
  role: string;
  profiles?: {
    display_name?: string | null;
    avatar_url?: string | null;
  } | null;
}

interface Split {
  bill_id: string;
  user_id: string;
  amount: number;
  percentage: number;
}

interface Bill {
  id: string;
  amount: number;
  status: string;
  user_id: string;
  responsible_id?: string | null;
}

interface GroupBalancesProps {
  members: Member[];
  bills: Bill[];
  splits: Split[];
}

interface Debt {
  from: string;
  to: string;
  amount: number;
}

const GroupBalances = ({ members, bills, splits }: GroupBalancesProps) => {
  const { formatCurrency } = useFormat();

  const debts = useMemo(() => {
    // Calculate net balance for each member
    // Positive = is owed money, Negative = owes money
    const balances: Record<string, number> = {};
    members.forEach(m => { balances[m.user_id] = 0; });

    // For each paid bill with splits, the payer (user_id or responsible_id) paid the full amount
    // and each participant owes their split amount
    const paidBills = bills.filter(b => b.status === 'pago');

    for (const bill of paidBills) {
      const billSplits = splits.filter(s => s.bill_id === bill.id);
      if (billSplits.length === 0) continue;

      const payer = bill.responsible_id || bill.user_id;
      if (!balances.hasOwnProperty(payer)) continue;

      // Payer paid the full amount, so they are owed the total minus their own share
      for (const split of billSplits) {
        if (!balances.hasOwnProperty(split.user_id)) continue;
        if (split.user_id === payer) continue;
        // This person owes the payer their split amount
        balances[split.user_id] -= split.amount;
        balances[payer] += split.amount;
      }
    }

    // Simplify debts: people who owe pay to people who are owed
    const debtors = Object.entries(balances)
      .filter(([_, v]) => v < -0.01)
      .map(([id, v]) => ({ id, amount: Math.abs(v) }))
      .sort((a, b) => b.amount - a.amount);

    const creditors = Object.entries(balances)
      .filter(([_, v]) => v > 0.01)
      .map(([id, v]) => ({ id, amount: v }))
      .sort((a, b) => b.amount - a.amount);

    const result: Debt[] = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const amount = Math.min(debtors[i].amount, creditors[j].amount);
      if (amount > 0.01) {
        result.push({ from: debtors[i].id, to: creditors[j].id, amount });
      }
      debtors[i].amount -= amount;
      creditors[j].amount -= amount;
      if (debtors[i].amount < 0.01) i++;
      if (creditors[j].amount < 0.01) j++;
    }

    return result;
  }, [members, bills, splits]);

  const getMember = (userId: string) => members.find(m => m.user_id === userId);

  if (debts.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <Scale size={16} className="text-primary" />
          <h3 className="text-sm font-display font-semibold">Saldos do Grupo</h3>
        </div>
        <p className="text-xs text-muted-foreground text-center py-2">✨ Tudo acertado! Nenhuma dívida pendente.</p>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Scale size={16} className="text-primary" />
        <h3 className="text-sm font-display font-semibold">Quem deve a quem</h3>
      </div>
      <div className="space-y-2.5">
        {debts.map((debt, i) => {
          const fromMember = getMember(debt.from);
          const toMember = getMember(debt.to);
          return (
            <div key={i} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2.5">
              <UserAvatar url={fromMember?.profiles?.avatar_url || null} name={fromMember?.profiles?.display_name || null} size="sm" />
              <span className="text-xs font-medium truncate max-w-[80px]">{fromMember?.profiles?.display_name || 'Membro'}</span>
              <div className="flex items-center gap-1 mx-1">
                <ArrowRight size={14} className="text-destructive" />
              </div>
              <UserAvatar url={toMember?.profiles?.avatar_url || null} name={toMember?.profiles?.display_name || null} size="sm" />
              <span className="text-xs font-medium truncate max-w-[80px]">{toMember?.profiles?.display_name || 'Membro'}</span>
              <span className="ml-auto text-sm font-bold text-destructive whitespace-nowrap">{formatCurrency(debt.amount)}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default GroupBalances;
