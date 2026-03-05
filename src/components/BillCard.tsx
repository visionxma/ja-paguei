import { Bill, CATEGORY_LABELS } from '@/types/finance';
import { Check, Clock, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';

interface BillCardProps {
  bill: Bill;
  onToggleStatus?: (id: string) => void;
}

const BillCard = ({ bill, onToggleStatus }: BillCardProps) => {
  const isPaid = bill.status === 'pago';

  const formatCurrency = (value: number) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const formatDate = (date?: string) => {
    if (!date) return '';
    return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 flex items-center gap-3"
    >
      <button
        onClick={() => onToggleStatus?.(bill.id)}
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          isPaid
            ? 'bg-success/20 text-success'
            : 'bg-secondary text-muted-foreground hover:bg-primary/20 hover:text-primary'
        }`}
      >
        {isPaid ? <Check size={18} /> : <Clock size={18} />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm truncate ${isPaid ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
          {bill.description}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[bill.category]}</span>
          {bill.dueDate && (
            <>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">{formatDate(bill.dueDate)}</span>
            </>
          )}
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <p className={`font-semibold text-sm ${isPaid ? 'text-muted-foreground' : 'text-foreground'}`}>
          {formatCurrency(bill.amount)}
        </p>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
          isPaid ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
        }`}>
          {isPaid ? 'Pago' : 'Pendente'}
        </span>
      </div>
    </motion.div>
  );
};

export default BillCard;
