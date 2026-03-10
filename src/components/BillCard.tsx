import { Bill, CATEGORY_LABELS, BillCategory } from '@/types/finance';
import { Check, Clock, Trash2, Edit2, Paperclip } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFormat } from '@/contexts/FormatContext';

interface BillCardProps {
  bill: Bill;
  onToggleStatus?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (bill: Bill) => void;
  onOpenAttachments?: (billId: string) => void;
  responsibleName?: string;
  isToggling?: boolean;
  isDeleting?: boolean;
}

const BillCard = ({ bill, onToggleStatus, onDelete, onEdit, onOpenAttachments, responsibleName, isToggling, isDeleting }: BillCardProps) => {
  const isPaid = bill.status === 'pago';
  const { formatCurrency, formatDate } = useFormat();

  const formatShortDate = (date?: string) => {
    if (!date) return '';
    return formatDate(date);
  };

  const isOverdue = bill.dueDate && !isPaid && new Date(bill.dueDate) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-4 ${isOverdue ? 'border-destructive/50' : ''}`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => onToggleStatus?.(bill.id)}
          disabled={isToggling}
          className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all disabled:opacity-50 ${
            isPaid
              ? 'bg-success/20 text-success'
              : 'bg-secondary text-muted-foreground hover:bg-primary/20 hover:text-primary'
          }`}
        >
          {isToggling ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : isPaid ? <Check size={18} /> : <Clock size={18} />}
        </button>

        <div className="flex-1 min-w-0">
          <p className={`font-medium text-sm truncate ${isPaid ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
            {bill.description}
          </p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[bill.category as BillCategory] || bill.category}</span>
            {bill.dueDate && (
              <>
                <span className="text-xs text-muted-foreground">•</span>
                <span className={`text-xs ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                  {isOverdue ? '⚠️ ' : ''}{formatShortDate(bill.dueDate)}
                </span>
              </>
            )}
            {responsibleName && (
              <>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{responsibleName}</span>
              </>
            )}
          </div>
          {bill.notes && (
            <p className="text-xs text-muted-foreground mt-1 truncate italic">{bill.notes}</p>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          <p className={`font-semibold text-sm ${isPaid ? 'text-muted-foreground' : 'text-foreground'}`}>
            {formatCurrency(bill.amount)}
          </p>
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
            isPaid ? 'bg-success/15 text-success' : isOverdue ? 'bg-destructive/15 text-destructive' : 'bg-warning/15 text-warning'
          }`}>
            {isPaid ? 'Pago' : isOverdue ? 'Atrasado' : 'Pendente'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
        {onOpenAttachments && (
          <button onClick={() => onOpenAttachments(bill.id)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary/10">
            <Paperclip size={12} /> Anexos
          </button>
        )}
        {onEdit && (
          <button onClick={() => onEdit(bill)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary/10">
            <Edit2 size={12} /> Editar
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(bill.id)}
            disabled={isDeleting}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 rounded-lg hover:bg-destructive/10 ml-auto disabled:opacity-50"
          >
            {isDeleting ? (
              <div className="w-3 h-3 border-2 border-destructive border-t-transparent rounded-full animate-spin" />
            ) : (
              <Trash2 size={12} />
            )}
            Excluir
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default BillCard;
