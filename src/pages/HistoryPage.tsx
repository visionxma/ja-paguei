import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useFormat } from '@/contexts/FormatContext';
import { fetchPersonalBills } from '@/lib/api';
import { CATEGORY_LABELS, BillCategory } from '@/types/finance';

const HistoryPage = () => {
  const { user } = useAuth();
  const { formatCurrency, formatDate } = useFormat();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('todos');

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['personal-bills', user?.id],
    queryFn: () => fetchPersonalBills(user!.id),
    enabled: !!user,
  });

  const paidBills = useMemo(() => {
    let result = bills.filter(b => b.status === 'pago');
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b => b.description.toLowerCase().includes(q));
    }
    if (selectedMonth !== 'todos') {
      result = result.filter(b => {
        if (!b.paid_at) return false;
        const d = new Date(b.paid_at);
        return `${d.getFullYear()}-${d.getMonth()}` === selectedMonth;
      });
    }
    return result.sort((a, b) => new Date(b.paid_at || 0).getTime() - new Date(a.paid_at || 0).getTime());
  }, [bills, searchQuery, selectedMonth]);

  // Get unique months from paid bills
  const months = useMemo(() => {
    const monthSet = new Map<string, string>();
    bills.filter(b => b.status === 'pago' && b.paid_at).forEach(b => {
      const d = new Date(b.paid_at!);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!monthSet.has(key)) {
        monthSet.set(key, d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }));
      }
    });
    return Array.from(monthSet.entries());
  }, [bills]);

  const totalPaid = paidBills.reduce((s, b) => s + Number(b.amount), 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6 pb-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold">Histórico</h1>
          <p className="text-sm text-muted-foreground mt-1">Pagamentos realizados</p>
        </motion.div>

        {paidBills.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-4 glass-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total pago</p>
            <p className="text-xl font-display font-bold text-success mt-1">{formatCurrency(totalPaid)}</p>
            <p className="text-xs text-muted-foreground mt-1">{paidBills.length} pagamentos</p>
          </motion.div>
        )}
      </div>

      <div className="px-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar no histórico..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-secondary border border-border text-foreground rounded-xl pl-9 pr-8 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Month filter */}
        {months.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setSelectedMonth('todos')} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${selectedMonth === 'todos' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
              Todos
            </button>
            {months.map(([key, label]) => (
              <button key={key} onClick={() => setSelectedMonth(key)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap capitalize ${selectedMonth === key ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
                {label}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : paidBills.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Clock size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum pagamento registrado.</p>
          </div>
        ) : (
          paidBills.map((bill, i) => (
            <motion.div key={bill.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{bill.description}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[bill.category as BillCategory] || bill.category}</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">Pago em {formatDate(bill.paid_at)}</span>
                  </div>
                </div>
                <p className="text-sm font-semibold text-success ml-3">{formatCurrency(bill.amount)}</p>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
