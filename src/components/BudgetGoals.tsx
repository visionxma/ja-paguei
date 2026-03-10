import { useState } from 'react';
import { Target, Plus, X, Check, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFormat } from '@/contexts/FormatContext';
import { CATEGORY_LABELS, type BillCategory } from '@/types/finance';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface BudgetGoal {
  id: string;
  user_id: string;
  category: string;
  monthly_limit: number;
}

interface BudgetGoalsProps {
  /** Current month spending per category */
  spendingByCategory: Record<string, number>;
}

const BudgetGoals = ({ spendingByCategory }: BudgetGoalsProps) => {
  const { user } = useAuth();
  const { formatCurrency } = useFormat();
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [newLimit, setNewLimit] = useState('');

  const { data: goals = [] } = useQuery({
    queryKey: ['budget-goals', user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('budget_goals')
        .select('*')
        .eq('user_id', user!.id);
      if (error) throw error;
      return data as BudgetGoal[];
    },
    enabled: !!user,
  });

  const upsertGoal = useMutation({
    mutationFn: async ({ category, limit }: { category: string; limit: number }) => {
      const { error } = await (supabase as any)
        .from('budget_goals')
        .upsert({ user_id: user!.id, category, monthly_limit: limit }, { onConflict: 'user_id,category' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-goals'] });
      toast.success('Meta salva!');
      setShowAdd(false);
      setEditId(null);
      setNewCategory('');
      setNewLimit('');
    },
    onError: () => toast.error('Erro ao salvar meta'),
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from('budget_goals').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-goals'] });
      toast.success('Meta removida');
    },
  });

  const existingCategories = goals.map(g => g.category);
  const availableCategories = Object.keys(CATEGORY_LABELS).filter(c => !existingCategories.includes(c));

  const handleSave = () => {
    if (!newCategory || !newLimit || Number(newLimit) <= 0) {
      toast.error('Preencha todos os campos');
      return;
    }
    upsertGoal.mutate({ category: newCategory, limit: Number(newLimit) });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target size={16} className="text-primary" />
          <h3 className="text-sm font-display font-semibold">Metas de Orçamento</h3>
        </div>
        {availableCategories.length > 0 && (
          <button onClick={() => { setShowAdd(true); setNewCategory(availableCategories[0]); }} className="p-1.5 rounded-full hover:bg-muted transition-colors text-primary">
            <Plus size={16} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-3">
            <div className="bg-muted rounded-lg p-3 space-y-2">
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)}
                className="w-full bg-background rounded-lg px-3 py-2 text-sm border border-border">
                {availableCategories.map(c => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c as BillCategory]}</option>
                ))}
              </select>
              <input type="number" placeholder="Limite mensal" value={newLimit} onChange={e => setNewLimit(e.target.value)}
                className="w-full bg-background rounded-lg px-3 py-2 text-sm border border-border" min="0" step="0.01" />
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setShowAdd(false); setNewCategory(''); setNewLimit(''); }}
                  className="px-3 py-1.5 text-xs rounded-lg bg-secondary hover:bg-accent transition-colors">Cancelar</button>
                <button onClick={handleSave}
                  className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Salvar</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {goals.length === 0 && !showAdd ? (
        <p className="text-xs text-muted-foreground text-center py-2">Nenhuma meta definida. Toque em + para adicionar.</p>
      ) : (
        <div className="space-y-3">
          {goals.map(goal => {
            const spent = spendingByCategory[goal.category] || 0;
            const percentage = Math.min((spent / goal.monthly_limit) * 100, 100);
            const isOver = spent > goal.monthly_limit;

            return (
              <div key={goal.id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{CATEGORY_LABELS[goal.category as BillCategory] || goal.category}</span>
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-medium ${isOver ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {formatCurrency(spent)} / {formatCurrency(goal.monthly_limit)}
                    </span>
                    <button onClick={() => deleteGoal.mutate(goal.id)} className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <X size={12} />
                    </button>
                  </div>
                </div>
                <Progress value={percentage} className={`h-2 ${isOver ? '[&>div]:bg-destructive' : ''}`} />
                {isOver && (
                  <p className="text-[10px] text-destructive font-medium">
                    Acima do limite em {formatCurrency(spent - goal.monthly_limit)}!
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default BudgetGoals;
