import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, UserPlus, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchGroupDetail, fetchGroupMembers, fetchGroupBills, createBill, updateBill, updateBillStatus, deleteBill } from '@/lib/api';
import BillCard from '@/components/BillCard';
import FinanceCharts from '@/components/FinanceCharts';
import AddBillDialog from '@/components/AddBillDialog';
import AttachmentsDialog from '@/components/AttachmentsDialog';
import InviteMemberDialog from '@/components/InviteMemberDialog';
import SearchFilterBar from '@/components/SearchFilterBar';
import { Bill } from '@/types/finance';
import { toast } from 'sonner';

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showAddBill, setShowAddBill] = useState(false);
  const [editBill, setEditBill] = useState<any>(null);
  const [attachBillId, setAttachBillId] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [activeTab, setActiveTab] = useState<'contas' | 'graficos'>('contas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [periodFilter, setPeriodFilter] = useState('todos');

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
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['group-bills', id] }); toast.success('Conta criada!'); },
  });

  const editMutation = useMutation({
    mutationFn: ({ billId, updates }: { billId: string; updates: any }) => updateBill(billId, updates),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['group-bills', id] }); toast.success('Conta atualizada!'); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ billId, status, paidAt }: { billId: string; status: string; paidAt?: string | null }) =>
      updateBillStatus(billId, status, paidAt),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-bills', id] }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBill,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['group-bills', id] }); toast.success('Conta excluída!'); },
  });

  const toggleStatus = (billId: string) => {
    const bill = bills.find(b => b.id === billId);
    if (!bill) return;
    const newStatus = bill.status === 'pago' ? 'pendente' : 'pago';
    toggleMutation.mutate({ billId, status: newStatus, paidAt: newStatus === 'pago' ? new Date().toISOString() : null });
  };

  const handleDelete = (billId: string) => {
    if (window.confirm('Excluir esta conta?')) deleteMutation.mutate(billId);
  };

  const handleEdit = (bill: any) => { setEditBill(bill); setShowAddBill(true); };
  const handleEditSubmit = (billId: string, updates: any) => editMutation.mutate({ billId, updates });

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
      notes: bill.notes || null,
      responsible_id: bill.responsibleId || null,
    });
  };

  // Get member name by user_id
  const getMemberName = (userId?: string) => {
    if (!userId) return undefined;
    const m = members.find(m => m.user_id === userId);
    return (m as any)?.profiles?.display_name || undefined;
  };

  // Filter bills
  const filteredBills = useMemo(() => {
    let result = bills;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b => b.description.toLowerCase().includes(q));
    }
    if (selectedCategory !== 'todas') result = result.filter(b => b.category === selectedCategory);
    if (periodFilter === 'atrasados') {
      result = result.filter(b => b.status === 'pendente' && b.due_date && new Date(b.due_date) < new Date());
    } else if (periodFilter === 'mes') {
      const now = new Date();
      result = result.filter(b => { if (!b.due_date) return true; const d = new Date(b.due_date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
    }
    return result;
  }, [bills, searchQuery, selectedCategory, periodFilter]);

  if (loadingGroup) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!group) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Grupo não encontrado</p></div>;

  const pendingBills = filteredBills.filter(b => b.status === 'pendente');
  const paidBills = filteredBills.filter(b => b.status === 'pago');
  const overdueBills = bills.filter(b => b.status === 'pendente' && b.due_date && new Date(b.due_date) < new Date());

  const toBillCard = (bill: any) => ({ ...bill, dueDate: bill.due_date || undefined, paidAt: bill.paid_at || undefined, createdAt: bill.created_at });
  const billsForChart = bills.map(toBillCard) as any;
  const totalPending = pendingBills.reduce((s, b) => s + Number(b.amount), 0);
  const monthlyData = [{ month: 'Mar', total: bills.reduce((s, b) => s + Number(b.amount), 0), paid: bills.filter(b => b.status === 'pago').reduce((s, b) => s + Number(b.amount), 0), pending: totalPending }];

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

        {overdueBills.length > 0 && (
          <div className="mt-3 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-destructive flex-shrink-0" />
            <p className="text-xs text-destructive"><span className="font-semibold">{overdueBills.length} conta(s) atrasada(s)</span> no grupo!</p>
          </div>
        )}

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
          <button onClick={() => setShowInvite(true)} className="ml-auto flex items-center gap-1 text-primary text-xs font-medium hover:underline">
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
            <SearchFilterBar searchQuery={searchQuery} onSearchChange={setSearchQuery} selectedCategory={selectedCategory} onCategoryChange={setSelectedCategory} periodFilter={periodFilter} onPeriodChange={setPeriodFilter} />

            <button onClick={() => { setEditBill(null); setShowAddBill(true); }} className="w-full glass-card p-3 flex items-center justify-center gap-2 text-primary text-sm font-medium hover:bg-primary/10 transition-colors">
              <Plus size={18} /> Nova Conta
            </button>

            {filteredBills.length === 0 && (
              <div className="glass-card p-8 text-center"><p className="text-muted-foreground text-sm">Nenhuma conta encontrada.</p></div>
            )}
            {pendingBills.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-4 mb-2">Pendentes ({pendingBills.length})</p>
                {pendingBills.map(bill => <BillCard key={bill.id} bill={toBillCard(bill) as any} onToggleStatus={toggleStatus} onDelete={handleDelete} onEdit={handleEdit} onOpenAttachments={setAttachBillId} responsibleName={getMemberName(bill.responsible_id || undefined)} />)}
              </>
            )}
            {paidBills.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-4 mb-2">Pagas ({paidBills.length})</p>
                {paidBills.map(bill => <BillCard key={bill.id} bill={toBillCard(bill) as any} onToggleStatus={toggleStatus} onDelete={handleDelete} onEdit={handleEdit} onOpenAttachments={setAttachBillId} responsibleName={getMemberName(bill.responsible_id || undefined)} />)}
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
        isGroup
        members={members as any}
      />

      {attachBillId && (
        <AttachmentsDialog open={!!attachBillId} onOpenChange={(v) => { if (!v) setAttachBillId(null); }} billId={attachBillId} />
      )}

      <InviteMemberDialog open={showInvite} onOpenChange={setShowInvite} groupId={id!} />
    </div>
  );
};

export default GroupDetail;
