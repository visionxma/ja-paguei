import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchGroupDetail, fetchGroupMembers, fetchGroupBills, createBill, updateBillStatus } from '@/lib/api';
import BillCard from '@/components/BillCard';
import FinanceCharts from '@/components/FinanceCharts';
import AddBillDialog from '@/components/AddBillDialog';
import { Bill } from '@/types/finance';

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddBill, setShowAddBill] = useState(false);
  const [activeTab, setActiveTab] = useState<'contas' | 'graficos'>('contas');

  const { data: group, isLoading: loadingGroup } = useQuery({
    queryKey: ['group', id],
    queryFn: () => fetchGroupDetail(id!),
    enabled: !!id,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['group-members', id],
    queryFn: () => fetchGroupMembers(id!),
    enabled: !!id,
  });

  const { data: bills = [], isLoading: loadingBills } = useQuery({
    queryKey: ['group-bills', id],
    queryFn: () => fetchGroupBills(id!),
    enabled: !!id,
  });

  const createMutation = useMutation({
    mutationFn: (bill: Parameters<typeof createBill>[0]) => createBill(bill),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-bills', id] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ billId, status, paidAt }: { billId: string; status: string; paidAt?: string | null }) =>
      updateBillStatus(billId, status, paidAt),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-bills', id] }),
  });

  const toggleStatus = (billId: string) => {
    const bill = bills.find(b => b.id === billId);
    if (!bill) return;
    const newStatus = bill.status === 'pago' ? 'pendente' : 'pago';
    toggleMutation.mutate({ billId, status: newStatus, paidAt: newStatus === 'pago' ? new Date().toISOString() : null });
  };

  const addBill = (bill: Omit<Bill, 'id' | 'createdAt'>) => {
    if (!user || !id) return;
    createMutation.mutate({
      user_id: user.id,
      group_id: id,
      description: bill.description,
      amount: bill.amount,
      due_date: bill.dueDate || null,
      category: bill.category,
      status: bill.status,
      recurrence: bill.recurrence,
    });
  };

  if (loadingGroup) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!group) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Grupo não encontrado</p></div>;
  }

  const pendingBills = bills.filter(b => b.status === 'pendente');
  const paidBills = bills.filter(b => b.status === 'pago');

  const billsForChart = bills.map(b => ({ ...b, dueDate: b.due_date || undefined, paidAt: b.paid_at || undefined })) as any;
  const monthlyData = [{ month: 'Mar', total: bills.reduce((s, b) => s + Number(b.amount), 0), paid: paidBills.reduce((s, b) => s + Number(b.amount), 0), pending: pendingBills.reduce((s, b) => s + Number(b.amount), 0) }];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6 pb-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => navigate('/groups')} className="flex items-center gap-1 text-muted-foreground text-sm mb-3 hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Voltar
          </button>
          <h1 className="text-2xl font-display font-bold">{group.name}</h1>
          {group.description && <p className="text-sm text-muted-foreground mt-1">{group.description}</p>}
        </motion.div>

        <div className="flex items-center gap-3 mt-4">
          <div className="flex -space-x-2">
            {members.slice(0, 5).map((m) => (
              <div key={m.id} className="w-8 h-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-xs font-medium overflow-hidden">
                {(m as any).profiles?.avatar_url ? (
                  <img src={(m as any).profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  ((m as any).profiles?.display_name || '?').slice(0, 2).toUpperCase()
                )}
              </div>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{members.length} membros</span>
          <button className="ml-auto flex items-center gap-1 text-primary text-xs font-medium">
            <UserPlus size={14} /> Convidar
          </button>
        </div>
      </div>

      <div className="px-4 flex gap-2 mb-4">
        {(['contas', 'graficos'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
            {tab === 'contas' ? 'Contas' : 'Gráficos'}
          </button>
        ))}
      </div>

      <div className="px-4">
        {loadingBills ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : activeTab === 'contas' ? (
          <div className="space-y-3">
            <button onClick={() => setShowAddBill(true)} className="w-full glass-card p-3 flex items-center justify-center gap-2 text-primary text-sm font-medium hover:bg-primary/10 transition-colors">
              <Plus size={18} /> Nova Conta
            </button>
            {bills.length === 0 && (
              <div className="glass-card p-8 text-center"><p className="text-muted-foreground text-sm">Nenhuma conta no grupo ainda.</p></div>
            )}
            {pendingBills.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-4 mb-2">Pendentes</p>
                {pendingBills.map(bill => <BillCard key={bill.id} bill={{ ...bill, dueDate: bill.due_date || undefined, paidAt: bill.paid_at || undefined, createdAt: bill.created_at } as any} onToggleStatus={toggleStatus} />)}
              </>
            )}
            {paidBills.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-4 mb-2">Pagas</p>
                {paidBills.map(bill => <BillCard key={bill.id} bill={{ ...bill, dueDate: bill.due_date || undefined, paidAt: bill.paid_at || undefined, createdAt: bill.created_at } as any} onToggleStatus={toggleStatus} />)}
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

export default GroupDetail;
