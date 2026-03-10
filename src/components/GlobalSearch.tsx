import { useState, useMemo } from 'react';
import { Search, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFormat } from '@/contexts/FormatContext';
import { fetchPersonalBills, fetchGroups, fetchGroupBills } from '@/lib/api';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchResult {
  id: string;
  description: string;
  amount: number;
  status: string;
  category: string;
  groupName?: string;
  groupId?: string;
}

const GlobalSearch = () => {
  const { user } = useAuth();
  const { formatCurrency } = useFormat();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);

  const { data: personalBills = [] } = useQuery({
    queryKey: ['personal-bills', user?.id],
    queryFn: () => fetchPersonalBills(user!.id),
    enabled: !!user,
  });

  const { data: groupMemberships = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
    enabled: !!user,
  });

  const groups = useMemo(() => {
    return groupMemberships
      .filter(gm => gm.groups)
      .reduce((acc, gm) => {
        const g = gm.groups as { id: string; name: string };
        if (!acc.some(x => x.id === g.id)) acc.push(g);
        return acc;
      }, [] as { id: string; name: string }[]);
  }, [groupMemberships]);

  const { data: allGroupBills = [] } = useQuery({
    queryKey: ['all-group-bills-search', groups.map(g => g.id)],
    queryFn: async () => {
      const results = await Promise.all(groups.map(async g => {
        const bills = await fetchGroupBills(g.id);
        return bills.map(b => ({ ...b, groupName: g.name, groupId: g.id }));
      }));
      return results.flat();
    },
    enabled: groups.length > 0,
  });

  const results = useMemo((): SearchResult[] => {
    if (!debouncedQuery || debouncedQuery.length < 2) return [];
    const q = debouncedQuery.toLowerCase();

    const personal: SearchResult[] = personalBills
      .filter(b => b.description.toLowerCase().includes(q) || b.category.toLowerCase().includes(q))
      .map(b => ({ id: b.id, description: b.description, amount: b.amount, status: b.status, category: b.category }));

    const group: SearchResult[] = allGroupBills
      .filter(b => b.description.toLowerCase().includes(q) || b.category.toLowerCase().includes(q) || b.groupName?.toLowerCase().includes(q))
      .map(b => ({ id: b.id, description: b.description, amount: b.amount, status: b.status, category: b.category, groupName: b.groupName, groupId: b.groupId }));

    return [...personal, ...group].slice(0, 20);
  }, [debouncedQuery, personalBills, allGroupBills]);

  return (
    <>
      <button onClick={() => setOpen(true)} className="p-2 rounded-full hover:bg-muted transition-colors" aria-label="Busca global">
        <Search size={20} className="text-foreground" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50" onClick={() => { setOpen(false); setQuery(''); }} />
            <motion.div
              initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg z-50"
            >
              <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                  <Search size={16} className="text-muted-foreground shrink-0" />
                  <input
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Buscar contas em tudo..."
                    className="flex-1 bg-transparent text-sm focus:outline-none"
                    autoFocus
                  />
                  <button onClick={() => { setOpen(false); setQuery(''); }} className="p-1 rounded hover:bg-muted">
                    <X size={16} className="text-muted-foreground" />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {debouncedQuery.length >= 2 && results.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-6">Nenhum resultado encontrado</p>
                  )}
                  {results.map(r => (
                    <button
                      key={r.id}
                      onClick={() => {
                        if (r.groupId) navigate(`/groups/${r.groupId}`);
                        else navigate('/');
                        setOpen(false);
                        setQuery('');
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors border-b border-border last:border-0"
                    >
                      <div className="flex items-center justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{r.description}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${r.status === 'pago' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                              {r.status}
                            </span>
                            {r.groupName && (
                              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                <Users size={10} /> {r.groupName}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-sm font-semibold ml-2">{formatCurrency(r.amount)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default GlobalSearch;
