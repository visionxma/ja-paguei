import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { mockPersonalBills } from '@/data/mockData';

const HistoryPage = () => {
  const paidBills = mockPersonalBills.filter(b => b.status === 'pago');
  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = (d?: string) => d ? new Date(d + 'T00:00:00').toLocaleDateString('pt-BR') : '';

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6 pb-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold">Histórico</h1>
          <p className="text-sm text-muted-foreground mt-1">Pagamentos realizados</p>
        </motion.div>
      </div>

      <div className="px-4 space-y-3">
        {paidBills.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Clock size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum pagamento registrado.</p>
          </div>
        ) : (
          paidBills.map((bill, i) => (
            <motion.div
              key={bill.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-4 flex items-center justify-between"
            >
              <div>
                <p className="text-sm font-medium">{bill.description}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Pago em {formatDate(bill.paidAt)}</p>
              </div>
              <p className="text-sm font-semibold text-success">{formatCurrency(bill.amount)}</p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
