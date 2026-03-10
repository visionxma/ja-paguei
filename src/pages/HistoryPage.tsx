import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useFormat } from '@/contexts/FormatContext';
import { fetchPersonalBills, fetchGroups, fetchGroupBills } from '@/lib/api';
import { CATEGORY_LABELS, BillCategory } from '@/types/finance';
import { useDebounce } from '@/hooks/useDebounce';

const HistoryPage = () => {
  const { user } = useAuth();
  const { formatCurrency, formatDate } = useFormat();
  const [localSearch, setLocalSearch] = useState('');
  const searchQuery = useDebounce(localSearch, 300);
  const [selectedMonth, setSelectedMonth] = useState('todos');

  const { data: personalBills = [], isLoading: loadingPersonal } = useQuery({
    queryKey: ['personal-bills', user?.id],
    queryFn: () => fetchPersonalBills(user!.id),
    enabled: !!user,
  });

  const { data: groupMemberships = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
    enabled: !!user,
  });

  const groupIds = useMemo(() => {
    return groupMemberships
      .filter(gm => gm.groups)
      .map(gm => (gm.groups as { id: string }).id)
      .filter((id, i, arr) => arr.indexOf(id) === i);
  }, [groupMemberships]);

  const { data: allGroupBills = [], isLoading: loadingGroups } = useQuery({
    queryKey: ['all-group-bills', groupIds],
    queryFn: async () => {
      const results = await Promise.all(groupIds.map(id => fetchGroupBills(id)));
      return results.flat();
    },
    enabled: groupIds.length > 0,
  });

  const isLoading = loadingPersonal || loadingGroups;

  const allBills = useMemo(() => {
    const combined = [...personalBills, ...allGroupBills];
    // Deduplicate by id
    const seen = new Set<string>();
    return combined.filter(b => {
      if (seen.has(b.id)) return false;
      seen.add(b.id);
      return true;
    });
  }, [personalBills, allGroupBills]);

  const paidBills = useMemo(() => {
    let result = allBills.filter(b => b.status === 'pago');
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
  }, [allBills, searchQuery, selectedMonth]);

  // Get unique months from paid bills
  const months = useMemo(() => {
    const monthSet = new Map<string, string>();
    allBills.filter(b => b.status === 'pago' && b.paid_at).forEach(b => {
      const d = new Date(b.paid_at!);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!monthSet.has(key)) {
        monthSet.set(key, d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }));
      }
    });
    return Array.from(monthSet.entries());
  }, [allBills]);

  const totalPaid = paidBills.reduce((s, b) => s + Number(b.amount), 0);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="px-4 md:px-8 pt-6 pb-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold">Histórico</h1>
          <p className="text-sm text-muted-foreground mt-1">Pagamentos realizados (pessoais e de grupo)</p>
        </motion.div>

        {paidBills.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-4 glass-card p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total pago</p>
            <p className="text-xl font-display font-bold text-success mt-1">{formatCurrency(totalPaid)}</p>
            <p className="text-xs text-muted-foreground mt-1">{paidBills.length} pagamentos</p>
          </motion.div>
        )}
      </div>

      <div className="px-4 md:px-8 space-y-3">
        {/* Search with debounce */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar no histórico..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full bg-secondary border border-border text-foreground rounded-xl pl-9 pr-8 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {localSearch && (
            <button onClick={() => setLocalSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
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
            <p className="text-muted-foreground text-sm">
              {allBills.length === 0 ? 'Nenhuma conta registrada ainda.' : 'Nenhum pagamento encontrado com esses filtros.'}
            </p>
            {allBills.length > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                Marque contas como pagas no Dashboard ou nos Grupos para vê-las aqui.
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {paidBills.map((bill, i) => (
              <motion.div key={bill.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{bill.description}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[bill.category as BillCategory] || bill.category}</span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">Pago em {formatDate(bill.paid_at)}</span>
                      {bill.group_id && (
                        <>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">Grupo</span>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-success ml-3">{formatCurrency(bill.amount)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
