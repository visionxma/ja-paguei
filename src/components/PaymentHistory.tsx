import { Clock, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PaymentLog {
  id: string;
  bill_id: string;
  user_id: string;
  action: string;
  old_status: string | null;
  new_status: string | null;
  created_at: string;
}

interface PaymentHistoryProps {
  billId: string;
}

const PaymentHistory = ({ billId }: PaymentHistoryProps) => {
  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['payment-logs', billId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_logs')
        .select('*')
        .eq('bill_id', billId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as PaymentLog[];
    },
  });

  if (isLoading) return null;
  if (logs.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Clock size={12} className="text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Histórico</span>
      </div>
      <div className="space-y-1.5">
        {logs.slice(0, 5).map(log => (
          <div key={log.id} className="flex items-center gap-2 text-xs">
            {log.new_status === 'pago' ? (
              <ArrowUpCircle size={12} className="text-emerald-500 shrink-0" />
            ) : (
              <ArrowDownCircle size={12} className="text-amber-500 shrink-0" />
            )}
            <span className="text-muted-foreground">
              {log.old_status === 'pendente' && log.new_status === 'pago' ? 'Marcada como paga' : 
               log.old_status === 'pago' && log.new_status === 'pendente' ? 'Reaberta como pendente' : 
               `${log.old_status} → ${log.new_status}`}
            </span>
            <span className="text-muted-foreground/60 ml-auto text-[10px]">
              {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default PaymentHistory;
