import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, UserPlus, AlertTriangle, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useFormat } from '@/contexts/FormatContext';
import { fetchGroupDetail, fetchGroupMembers, fetchGroupBills, createBill, updateBill, updateBillStatus, deleteBill, saveBillSplits, fetchBillSplits, uploadAttachment, deleteGroup, removeGroupMember } from '@/lib/api';
import BillCard from '@/components/BillCard';
import FinanceCharts from '@/components/FinanceCharts';
import AddBillDialog from '@/components/AddBillDialog';
import AttachmentsDialog from '@/components/AttachmentsDialog';
import InviteMemberDialog from '@/components/InviteMemberDialog';
import SearchFilterBar from '@/components/SearchFilterBar';
import UserAvatar from '@/components/UserAvatar';
import GroupProfilePanel from '@/components/GroupProfilePanel';
import { Bill } from '@/types/finance';
import { toBillCard, buildMonthlyData } from '@/lib/bill-utils';
import { SplitEntry } from '@/components/BillSplitSection';
import { toast } from 'sonner';
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

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatCurrency } = useFormat();
  const queryClient = useQueryClient();
  const [showAddBill, setShowAddBill] = useState(false);
  const [editBill, setEditBill] = useState<ReturnType<typeof toBillCard> | null>(null);
  const [attachBillId, setAttachBillId] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [showGroupProfile, setShowGroupProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'contas' | 'graficos'>('contas');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [periodFilter, setPeriodFilter] = useState('todos');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
    onError: () => { toast.error('Erro ao criar conta'); },
  });

  const editMutation = useMutation({
    mutationFn: ({ billId, updates }: { billId: string; updates: Parameters<typeof updateBill>[1] }) => updateBill(billId, updates),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['group-bills', id] }); toast.success('Conta atualizada!'); },
    onError: () => { toast.error('Erro ao atualizar conta'); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ billId, status, paidAt }: { billId: string; status: string; paidAt?: string | null }) =>
      updateBillStatus(billId, status, paidAt),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['group-bills', id] }),
    onError: () => { toast.error('Erro ao alterar status'); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBill,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['group-bills', id] }); toast.success('Conta excluída!'); },
    onError: () => { toast.error('Erro ao excluir conta'); },
  });

  const toggleStatus = (billId: string) => {
    const bill = bills.find(b => b.id === billId);
    if (!bill) return;
    const newStatus = bill.status === 'pago' ? 'pendente' : 'pago';
    toggleMutation.mutate({ billId, status: newStatus, paidAt: newStatus === 'pago' ? new Date().toISOString() : null });
  };

  const handleDelete = (billId: string) => setDeleteConfirmId(billId);

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteMutation.mutate(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const [editSplits, setEditSplits] = useState<SplitEntry[]>([]);
  const handleEdit = async (bill: ReturnType<typeof toBillCard>) => {
    setEditBill(bill);
    try {
      const splits = await fetchBillSplits(bill.id);
      setEditSplits(splits || []);
    } catch {
      setEditSplits([]);
    }
    setShowAddBill(true);
  };

  const handleEditSubmit = async (billId: string, updates: Parameters<typeof updateBill>[1], splits?: SplitEntry[]) => {
    try {
      await editMutation.mutateAsync({ billId, updates });
      if (splits) await saveBillSplits(billId, splits);
    } catch (err) {
      console.error('[GroupDetail] Error editing bill:', err);
    }
  };

  const addBill = async (bill: Omit<Bill, 'id' | 'createdAt'>, splits?: SplitEntry[], pendingFiles?: File[]) => {
    if (!user || !id) return;
    try {
      const created = await createMutation.mutateAsync({
        user_id: user.id,
        group_id: id,
        description: bill.description,
        amount: bill.amount,
        start_date: bill.startDate || null,
        due_date: bill.dueDate || null,
        category: bill.category,
        status: bill.status,
        recurrence: bill.recurrence,
        notes: bill.notes || null,
        responsible_id: bill.responsibleId || null,
      });
      if (splits && splits.length > 0 && created?.id) {
        await saveBillSplits(created.id, splits);
      }
      if (pendingFiles && pendingFiles.length > 0 && created?.id) {
        for (const file of pendingFiles) {
          try {
            await uploadAttachment(created.id, user.id, file);
          } catch (err) {
            console.error('[GroupDetail] Error uploading attachment:', err);
          }
        }
        toast.success(`${pendingFiles.length} anexo(s) enviado(s)!`);
      }
    } catch (err) {
      console.error('[GroupDetail] Error creating bill:', err);
    }
  };

  // Get member name by user_id
  const getMemberName = (userId?: string) => {
    if (!userId) return undefined;
    const m = members.find(m => m.user_id === userId);
    return (m as { profiles?: { display_name?: string } })?.profiles?.display_name || undefined;
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

  // Build real monthly data (memoized) - must be before early returns
  const monthlyData = useMemo(() => buildMonthlyData(bills), [bills]);

  if (loadingGroup) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!group) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Grupo não encontrado</p></div>;

  const pendingBills = filteredBills.filter(b => b.status === 'pendente');
  const paidBills = filteredBills.filter(b => b.status === 'pago');
  const overdueBills = bills.filter(b => b.status === 'pendente' && b.due_date && new Date(b.due_date) < new Date());
  const billsForChart = bills.map(toBillCard);
  const totalPending = pendingBills.reduce((s, b) => s + Number(b.amount), 0);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="px-4 md:px-8 pt-6 pb-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => navigate('/groups')} className="flex items-center gap-1 text-muted-foreground text-sm mb-3 hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Voltar
          </button>
          <button onClick={() => setShowGroupProfile(true)} className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity">
            {(group as Record<string, unknown>).image_url ? (
              <img src={(group as Record<string, unknown>).image_url as string} alt={group.name} className="w-12 h-12 rounded-full object-cover border-2 border-primary/20" />
            ) : (
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center border-2 border-primary/20">
                <Users size={20} className="text-primary-foreground" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-display font-bold">{group.name}</h1>
              <p className="text-xs text-muted-foreground">{members.length} participantes · Toque para mais info</p>
            </div>
          </button>
          {group.description && <p className="text-sm text-muted-foreground mt-2 ml-15">{group.description}</p>}
        </motion.div>

        {overdueBills.length > 0 && (
          <div className="mt-3 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-destructive flex-shrink-0" />
            <p className="text-xs text-destructive"><span className="font-semibold">{overdueBills.length} conta(s) atrasada(s)</span> no grupo!</p>
          </div>
        )}

        <div className="flex items-center gap-3 mt-4">
          <div className="flex -space-x-2" onClick={() => setShowGroupProfile(true)} role="button" tabIndex={0}>
            {members.slice(0, 5).map((m) => {
              const profile = m as { id: string; profiles?: { avatar_url?: string; display_name?: string } };
              return (
                <div key={m.id} className="border-2 border-background rounded-full">
                  <UserAvatar
                    url={profile.profiles?.avatar_url || null}
                    name={profile.profiles?.display_name || null}
                    size="sm"
                  />
                </div>
              );
            })}
          </div>
          <span className="text-xs text-muted-foreground">{members.length} membros</span>
          <button onClick={() => setShowInvite(true)} className="ml-auto flex items-center gap-1 text-primary text-xs font-medium hover:underline">
            <UserPlus size={14} /> Convidar
          </button>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-4 gradient-primary rounded-2xl p-5">
          <p className="text-sm text-primary-foreground/70">Total pendente do grupo</p>
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

      <div className="px-4 md:px-8 flex gap-2 mb-4">
        {(['contas', 'graficos'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}>
            {tab === 'contas' ? 'Contas' : 'Gráficos'}
          </button>
        ))}
      </div>

      <div className="px-4 md:px-8">
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
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {pendingBills.map(bill => <BillCard key={bill.id} bill={toBillCard(bill)} onToggleStatus={toggleStatus} onDelete={handleDelete} onEdit={handleEdit} onOpenAttachments={setAttachBillId} responsibleName={getMemberName(bill.responsible_id || undefined)} />)}
                </div>
              </>
            )}
            {paidBills.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-4 mb-2">Pagas ({paidBills.length})</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {paidBills.map(bill => <BillCard key={bill.id} bill={toBillCard(bill)} onToggleStatus={toggleStatus} onDelete={handleDelete} onEdit={handleEdit} onOpenAttachments={setAttachBillId} responsibleName={getMemberName(bill.responsible_id || undefined)} />)}
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
        onOpenChange={(v) => { setShowAddBill(v); if (!v) { setEditBill(null); setEditSplits([]); } }}
        onAdd={addBill}
        editBill={editBill}
        onEdit={handleEditSubmit}
        isGroup
        members={members as unknown as { user_id: string; profiles: { display_name: string | null } | null }[]}
        existingSplits={editSplits}
      />

      {attachBillId && (
        <AttachmentsDialog open={!!attachBillId} onOpenChange={(v) => { if (!v) setAttachBillId(null); }} billId={attachBillId} />
      )}

      <InviteMemberDialog open={showInvite} onOpenChange={setShowInvite} groupId={id!} existingMemberIds={members.map(m => m.user_id)} />

      <GroupProfilePanel
        open={showGroupProfile}
        onClose={() => setShowGroupProfile(false)}
        group={group as Parameters<typeof GroupProfilePanel>[0]['group']}
        members={members as Parameters<typeof GroupProfilePanel>[0]['members']}
        onInvite={() => { setShowGroupProfile(false); setShowInvite(true); }}
        onLeaveGroup={async () => {
          const self = members.find(m => m.user_id === user?.id);
          if (self) {
            try {
              await removeGroupMember(self.id);
              toast.success('Você saiu do grupo');
              navigate('/groups');
            } catch { toast.error('Erro ao sair do grupo'); }
          }
        }}
        onDeleteGroup={async () => {
          try {
            await deleteGroup(group.id);
            toast.success('Grupo excluído');
            navigate('/groups');
          } catch { toast.error('Erro ao excluir grupo'); }
        }}
      />

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

export default GroupDetail;
