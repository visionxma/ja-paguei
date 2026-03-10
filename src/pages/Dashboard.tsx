import { useState, useMemo, useEffect } from 'react';
import { Plus, AlertTriangle, FileDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import BillCard from '@/components/BillCard';
import FinanceCharts from '@/components/FinanceCharts';
import AddBillDialog from '@/components/AddBillDialog';
import AttachmentsDialog from '@/components/AttachmentsDialog';
import SearchFilterBar from '@/components/SearchFilterBar';
import BudgetGoals from '@/components/BudgetGoals';
import { useAuth } from '@/contexts/AuthContext';
import { useFormat } from '@/contexts/FormatContext';
import { fetchPersonalBills, createBill, updateBill, updateBillStatus, deleteBill, uploadAttachment } from '@/lib/api';
import { toBillCard, buildMonthlyData, type BillRow } from '@/lib/bill-utils';
import { Bill } from '@/types/finance';
import { useBillDueNotifications, useNotificationPermission } from '@/hooks/useNotifications';
import { toast } from 'sonner';
import { generateReportPDF } from '@/lib/generate-report-pdf';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

const Dashboard = () => {
  const { user, profile } = useAuth();
  const { formatCurrency, formatDate } = useFormat();
  const queryClient = useQueryClient();
  const [showAddBill, setShowAddBill] = useState(false);
  const [editBill, setEditBill] = useState<ReturnType<typeof toBillCard> | null>(null);
  const [attachBillId, setAttachBillId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'contas' | 'graficos'>('contas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [periodFilter, setPeriodFilter] = useState('todos');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Auto-request notification permission on first visit
  const { permission, requestPermission } = useNotificationPermission();
  useEffect(() => {
    if (permission === 'default') {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Trigger browser notifications for bills near due date
  useBillDueNotifications();

  const { data: bills = [], isLoading } = useQuery({
    queryKey: ['personal-bills', user?.id],
    queryFn: () => fetchPersonalBills(user!.id),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (bill: Parameters<typeof createBill>[0]) => createBill(bill),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['personal-bills'] }); toast.success('Conta criada!'); },
    onError: () => { toast.error('Erro ao criar conta'); },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateBill>[1] }) => updateBill(id, updates),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['personal-bills'] }); toast.success('Conta atualizada!'); },
    onError: () => { toast.error('Erro ao atualizar conta'); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status, paidAt }: { id: string; status: string; paidAt?: string | null }) =>
      updateBillStatus(id, status, paidAt),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['personal-bills'] }),
    onError: () => { toast.error('Erro ao alterar status'); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBill,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['personal-bills'] }); toast.success('Conta excluída!'); },
    onError: () => { toast.error('Erro ao excluir conta'); },
  });

  const toggleStatus = (id: string) => {
    const bill = bills.find(b => b.id === id);
    if (!bill) return;
    const newStatus = bill.status === 'pago' ? 'pendente' : 'pago';
    toggleMutation.mutate({ id, status: newStatus, paidAt: newStatus === 'pago' ? new Date().toISOString() : null });
  };

  const handleDelete = (id: string) => setDeleteConfirmId(id);

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteMutation.mutate(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleEdit = (bill: ReturnType<typeof toBillCard>) => {
    setEditBill(bill);
    setShowAddBill(true);
  };

  const handleEditSubmit = (id: string, updates: Parameters<typeof updateBill>[1]) => {
    editMutation.mutate({ id, updates });
  };

  const addBill = async (bill: Omit<Bill, 'id' | 'createdAt'>, _splits?: unknown, pendingFiles?: File[]) => {
    if (!user) return;
    try {
      const created = await createMutation.mutateAsync({
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
      if (pendingFiles && pendingFiles.length > 0 && created?.id) {
        for (const file of pendingFiles) {
          try {
            await uploadAttachment(created.id, user.id, file);
          } catch (err) {
            console.error('[Dashboard] Error uploading attachment:', err);
          }
        }
        toast.success(`${pendingFiles.length} anexo(s) enviado(s)!`);
      }
    } catch (err) {
      console.error('[Dashboard] Error creating bill:', err);
    }
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
    if (periodFilter !== 'todos') {
      const now = new Date();
      const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const today = startOfDay(now);
      const tomorrow = new Date(today.getTime() + 86400000);
      const dayOfWeek = today.getDay(); // 0=Sun
      const thisWeekStart = new Date(today.getTime() - dayOfWeek * 86400000);
      const thisWeekEnd = new Date(thisWeekStart.getTime() + 7 * 86400000);
      const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * 86400000);
      const twoWeeksAgoStart = new Date(thisWeekStart.getTime() - 14 * 86400000);
      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);

      result = result.filter(b => {
        if (!b.due_date) return false;
        const d = startOfDay(new Date(b.due_date));
        switch (periodFilter) {
          case 'hoje': return d.getTime() === today.getTime();
          case 'amanha': return d.getTime() === tomorrow.getTime();
          case 'semana': return d >= thisWeekStart && d < thisWeekEnd;
          case 'semana_passada': return d >= lastWeekStart && d < thisWeekStart;
          case 'semana_retrasada': return d >= twoWeeksAgoStart && d < lastWeekStart;
          case 'mes': return d >= thisMonthStart;
          case 'mes_passado': return d >= lastMonthStart && d <= lastMonthEnd;
          case 'proximos_7': return d >= today && d < new Date(today.getTime() + 7 * 86400000);
          case 'proximos_30': return d >= today && d < new Date(today.getTime() + 30 * 86400000);
          case 'atrasados': return b.status === 'pendente' && d < today;
          default: return true;
        }
      });
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

  const monthlyData = useMemo(() => buildMonthlyData(bills), [bills]);
  const billsForChart = useMemo(() => bills.map(toBillCard), [bills]);

  // Spending by category for budget goals (current month, pending+paid)
  const spendingByCategory = useMemo(() => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const result: Record<string, number> = {};
    bills.forEach(b => {
      const d = b.due_date ? new Date(b.due_date) : new Date(b.created_at);
      if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) {
        result[b.category] = (result[b.category] || 0) + Number(b.amount);
      }
    });
    return result;
  }, [bills]);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="px-4 md:px-8 pt-6 pb-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm text-muted-foreground">Olá, {profile?.display_name || 'Usuário'} 👋</p>
          <h1 className="text-2xl font-display font-bold mt-1">Minhas Contas</h1>
        </motion.div>

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
            {formatCurrency(totalPending)}
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

      <div className="px-4 md:px-8 flex gap-2 mb-4 items-center">
        {(['contas', 'graficos'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
            {tab === 'contas' ? 'Contas' : 'Gráficos'}
          </button>
        ))}
        <button
          onClick={() => {
            if (bills.length === 0) { toast.error('Nenhuma conta para exportar'); return; }
            generateReportPDF({
              bills,
              userName: profile?.display_name || 'Usuário',
              formatCurrency,
              formatDate,
            });
            toast.success('Relatório PDF gerado com sucesso!');
          }}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-secondary text-secondary-foreground hover:bg-accent transition-all"
        >
          <FileDown size={16} />
          <span className="hidden sm:inline">Exportar PDF</span>
        </button>
      </div>

      <div className="px-4 md:px-8">
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {pendingBills.map(bill => (
                    <BillCard key={bill.id} bill={toBillCard(bill)} onToggleStatus={toggleStatus} onDelete={handleDelete} onEdit={handleEdit} onOpenAttachments={setAttachBillId} isToggling={toggleMutation.isPending && toggleMutation.variables?.id === bill.id} isDeleting={deleteMutation.isPending && deleteConfirmId === bill.id} />
                  ))}
                </div>
              </>
            )}

            {paidBills.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-4 mb-2">Pagas ({paidBills.length})</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {paidBills.map(bill => (
                    <BillCard key={bill.id} bill={toBillCard(bill)} onToggleStatus={toggleStatus} onDelete={handleDelete} onEdit={handleEdit} onOpenAttachments={setAttachBillId} isToggling={toggleMutation.isPending && toggleMutation.variables?.id === bill.id} isDeleting={deleteMutation.isPending && deleteConfirmId === bill.id} />
                  ))}
                </div>
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

      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null); }}>
        <AlertDialogContent className="bg-card border-border text-foreground max-w-sm mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Excluir conta</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2">
            <AlertDialogCancel className="flex-1">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
