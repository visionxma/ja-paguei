import { useState, useMemo } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import BillCard from '@/components/BillCard';
import FinanceCharts from '@/components/FinanceCharts';
import AddBillDialog from '@/components/AddBillDialog';
import AttachmentsDialog from '@/components/AttachmentsDialog';
import SearchFilterBar from '@/components/SearchFilterBar';
import { useAuth } from '@/contexts/AuthContext';
import { fetchPersonalBills, createBill, updateBill, updateBillStatus, deleteBill } from '@/lib/api';
import { Bill } from '@/types/finance';
import { toast } from 'sonner';

const Dashboard = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [showAddBill, setShowAddBill] = useState(false);
  const [editBill, setEditBill] = useState<any>(null);
  const [attachBillId, setAttachBillId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'contas' | 'graficos'>('contas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [periodFilter, setPeriodFilter] = useState('todos');

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['personal-bills', user?.id],
    queryFn: () => fetchPersonalBills(user!.id),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (bill: Parameters<typeof createBill>[0]) => createBill(bill),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['personal-bills'] }); toast.success('Conta criada!'); },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => updateBill(id, updates),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['personal-bills'] }); toast.success('Conta atualizada!'); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status, paidAt }: { id: string; status: string; paidAt?: string | null }) =>
      updateBillStatus(id, status, paidAt),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['personal-bills'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBill,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['personal-bills'] }); toast.success('Conta excluída!'); },
  });

  const toggleStatus = (id: string) => {
    const bill = bills.find(b => b.id === id);
    if (!bill) return;
    const newStatus = bill.status === 'pago' ? 'pendente' : 'pago';
    toggleMutation.mutate({ id, status: newStatus, paidAt: newStatus === 'pago' ? new Date().toISOString() : null });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta conta?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (bill: any) => {
    setEditBill(bill);
    setShowAddBill(true);
  };

  const handleEditSubmit = (id: string, updates: any) => {
    editMutation.mutate({ id, updates });
  };

  const addBill = (bill: Omit<Bill, 'id' | 'createdAt'>) => {
    if (!user) return;
    createMutation.mutate({
      user_id: user.id,
      description: bill.description,
      amount: bill.amount,
      start_date: bill.startDate || null,
      due_date: bill.dueDate || null,
      category: bill.category,
      status: bill.status,
      recurrence: bill.recurrence,
      notes: bill.notes || null,
    });
  };

  // Filter bills
  const filteredBills = useMemo(() => {
    let result = bills;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b => b.description.toLowerCase().includes(q) || b.category.toLowerCase().includes(q));
    }
    if (selectedCategory !== 'todas') {
      result = result.filter(b => b.category === selectedCategory);
    }
    if (periodFilter === 'mes') {
      const now = new Date();
      result = result.filter(b => {
        if (!b.due_date) return true;
        const d = new Date(b.due_date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (periodFilter === 'semana') {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      result = result.filter(b => {
        if (!b.due_date) return false;
        const d = new Date(b.due_date);
        return d >= weekAgo && d <= weekAhead;
      });
    } else if (periodFilter === 'atrasados') {
      const now = new Date();
      result = result.filter(b => b.status === 'pendente' && b.due_date && new Date(b.due_date) < now);
    }
    return result;
  }, [bills, searchQuery, selectedCategory, periodFilter]);

  const pendingBills = filteredBills.filter(b => b.status === 'pendente');
  const paidBills = filteredBills.filter(b => b.status === 'pago');
  const totalPending = bills.filter(b => b.status === 'pendente').reduce((s, b) => s + Number(b.amount), 0);

  // Upcoming due notifications
  const today = new Date();
  const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
  const upcomingBills = bills.filter(b =>
    b.status === 'pendente' && b.due_date &&
    new Date(b.due_date) >= today && new Date(b.due_date) <= threeDaysFromNow
  );
  const overdueBills = bills.filter(b =>
    b.status === 'pendente' && b.due_date && new Date(b.due_date) < today
  );

  const toBillCard = (bill: any) => ({
    ...bill,
    dueDate: bill.due_date || undefined,
    paidAt: bill.paid_at || undefined,
    createdAt: bill.created_at,
  });

  const billsForChart = bills.map(b => toBillCard(b)) as any;
  const monthlyData = [
    { month: 'Mar', total: bills.reduce((s, b) => s + Number(b.amount), 0), paid: bills.filter(b => b.status === 'pago').reduce((s, b) => s + Number(b.amount), 0), pending: totalPending },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6 pb-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm text-muted-foreground">Olá, {profile?.display_name || 'Usuário'} 👋</p>
          <h1 className="text-2xl font-display font-bold mt-1">Minhas Contas</h1>
        </motion.div>

        {/* Notifications */}
        {(overdueBills.length > 0 || upcomingBills.length > 0) && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-3 space-y-2">
            {overdueBills.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-destructive flex-shrink-0" />
                <p className="text-xs text-destructive"><span className="font-semibold">{overdueBills.length} conta(s) atrasada(s)!</span> Verifique abaixo.</p>
              </div>
            )}
            {upcomingBills.length > 0 && (
              <div className="bg-warning/10 border border-warning/30 rounded-xl px-4 py-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-warning flex-shrink-0" />
                <p className="text-xs text-warning"><span className="font-semibold">{upcomingBills.length} conta(s)</span> vencem nos próximos 3 dias.</p>
              </div>
            )}
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-4 gradient-primary rounded-2xl p-5">
          <p className="text-sm text-primary-foreground/70">Total pendente este mês</p>
          <p className="text-3xl font-display font-bold text-primary-foreground mt-1">
            {totalPending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary-foreground/50" />
              <span className="text-xs text-primary-foreground/70">{bills.filter(b => b.status === 'pendente').length} pendentes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-primary-foreground" />
              <span className="text-xs text-primary-foreground/70">{bills.filter(b => b.status === 'pago').length} pagas</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="px-4 flex gap-2 mb-4">
        {(['contas', 'graficos'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
            {tab === 'contas' ? 'Contas' : 'Gráficos'}
          </button>
        ))}
      </div>

      <div className="px-4">
        {isLoading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : activeTab === 'contas' ? (
          <div className="space-y-3">
            <SearchFilterBar searchQuery={searchQuery} onSearchChange={setSearchQuery} selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} periodFilter={periodFilter} onPeriodChange={setPeriodFilter} />

            <button onClick={() => { setEditBill(null); setShowAddBill(true); }} className="w-full glass-card p-3 flex items-center justify-center gap-2 text-primary text-sm font-medium hover:bg-primary/10 transition-colors">
              <Plus size={18} /> Nova Conta
            </button>

            {filteredBills.length === 0 && (
              <div className="glass-card p-8 text-center">
                <p className="text-muted-foreground text-sm">{bills.length === 0 ? 'Nenhuma conta registrada ainda.' : 'Nenhuma conta encontrada com esses filtros.'}</p>
              </div>
            )}

            {pendingBills.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-4 mb-2">Pendentes ({pendingBills.length})</p>
                {pendingBills.map(bill => (
                  <BillCard key={bill.id} bill={toBillCard(bill) as any} onToggleStatus={toggleStatus} onDelete={handleDelete} onEdit={handleEdit} onOpenAttachments={setAttachBillId} />
                ))}
              </>
            )}

            {paidBills.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-4 mb-2">Pagas ({paidBills.length})</p>
                {paidBills.map(bill => (
                  <BillCard key={bill.id} bill={toBillCard(bill) as any} onToggleStatus={toggleStatus} onDelete={handleDelete} onEdit={handleEdit} onOpenAttachments={setAttachBillId} />
                ))}
              </>
            )}
          </div>
        ) : (
          <FinanceCharts bills={billsForChart} monthlyData={monthlyData} />
        )}
      </div>

      <AddBillDialog
        open={showAddBill}
        onOpenChange={(v) => { setShowAddBill(v); if (!v) setEditBill(null); }}
        onAdd={addBill}
        editBill={editBill}
        onEdit={handleEditSubmit}
        onOpenAttachments={setAttachBillId}
      />

      {attachBillId && (
        <AttachmentsDialog
          open={!!attachBillId}
          onOpenChange={(v) => { if (!v) setAttachBillId(null); }}
          billId={attachBillId}
        />
      )}
    </div>
  );
};

export default Dashboard;
