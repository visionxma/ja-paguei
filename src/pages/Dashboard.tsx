import { useState } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import BillCard from '@/components/BillCard';
import FinanceCharts from '@/components/FinanceCharts';
import AddBillDialog from '@/components/AddBillDialog';
import { useAuth } from '@/contexts/AuthContext';
import { fetchPersonalBills, createBill, updateBillStatus } from '@/lib/api';
import { Bill } from '@/types/finance';

const Dashboard = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [showAddBill, setShowAddBill] = useState(false);
  const [activeTab, setActiveTab] = useState<'contas' | 'graficos'>('contas');

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['personal-bills', user?.id],
    queryFn: () => fetchPersonalBills(user!.id),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (bill: Parameters<typeof createBill>[0]) => createBill(bill),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['personal-bills'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status, paidAt }: { id: string; status: string; paidAt?: string | null }) =>
      updateBillStatus(id, status, paidAt),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['personal-bills'] }),
  });

  const toggleStatus = (id: string) => {
    const bill = bills.find(b => b.id === id);
    if (!bill) return;
    const newStatus = bill.status === 'pago' ? 'pendente' : 'pago';
    toggleMutation.mutate({
      id,
      status: newStatus,
      paidAt: newStatus === 'pago' ? new Date().toISOString() : null,
    });
  };

  const addBill = (bill: Omit<Bill, 'id' | 'createdAt'>) => {
    if (!user) return;
    createMutation.mutate({
      user_id: user.id,
      description: bill.description,
      amount: bill.amount,
      due_date: bill.dueDate || null,
      category: bill.category,
      status: bill.status,
      recurrence: bill.recurrence,
    });
  };

  const pendingBills = bills.filter(b => b.status === 'pendente');
  const paidBills = bills.filter(b => b.status === 'pago');
  const totalPending = pendingBills.reduce((s, b) => s + Number(b.amount), 0);

  // Transform DB bills to component format
  const billsForChart = bills.map(b => ({
    ...b,
    dueDate: b.due_date || undefined,
    paidAt: b.paid_at || undefined,
  })) as any;

  const monthlyData = [
    { month: 'Mar', total: bills.reduce((s, b) => s + Number(b.amount), 0), paid: paidBills.reduce((s, b) => s + Number(b.amount), 0), pending: totalPending },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6 pb-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm text-muted-foreground">Olá, {profile?.display_name || 'Usuário'} 👋</p>
          <h1 className="text-2xl font-display font-bold mt-1">Minhas Contas</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-4 gradient-primary rounded-2xl p-5"
        >
          <p className="text-sm text-primary-foreground/70">Total pendente este mês</p>
          <p className="text-3xl font-display font-bold text-primary-foreground mt-1">
            {totalPending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary-foreground/50" />
              <span className="text-xs text-primary-foreground/70">{pendingBills.length} pendentes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary-foreground" />
              <span className="text-xs text-primary-foreground/70">{paidBills.length} pagas</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="px-4 flex gap-2 mb-4">
        {(['contas', 'graficos'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {tab === 'contas' ? 'Contas' : 'Gráficos'}
          </button>
        ))}
      </div>

      <div className="px-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'contas' ? (
          <div className="space-y-3">
            <button
              onClick={() => setShowAddBill(true)}
              className="w-full glass-card p-3 flex items-center justify-center gap-2 text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
            >
              <Plus size={18} />
              Nova Conta
            </button>

            {bills.length === 0 && (
              <div className="glass-card p-8 text-center">
                <p className="text-muted-foreground text-sm">Nenhuma conta registrada ainda.</p>
                <p className="text-xs text-muted-foreground mt-1">Toque em "Nova Conta" para começar.</p>
              </div>
            )}

            {pendingBills.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-4 mb-2">Pendentes</p>
                {pendingBills.map(bill => (
                  <BillCard key={bill.id} bill={{ ...bill, dueDate: bill.due_date || undefined, paidAt: bill.paid_at || undefined, createdAt: bill.created_at } as any} onToggleStatus={toggleStatus} />
                ))}
              </>
            )}

            {paidBills.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-4 mb-2">Pagas</p>
                {paidBills.map(bill => (
                  <BillCard key={bill.id} bill={{ ...bill, dueDate: bill.due_date || undefined, paidAt: bill.paid_at || undefined, createdAt: bill.created_at } as any} onToggleStatus={toggleStatus} />
                ))}
              </>
            )}
          </div>
        ) : (
          <FinanceCharts bills={billsForChart} monthlyData={monthlyData} />
        )}
      </div>

      <AddBillDialog open={showAddBill} onOpenChange={setShowAddBill} onAdd={addBill} />
    </div>
  );
};

export default Dashboard;
