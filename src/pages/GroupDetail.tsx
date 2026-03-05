import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { mockGroups, mockMonthlyData } from '@/data/mockData';
import BillCard from '@/components/BillCard';
import FinanceCharts from '@/components/FinanceCharts';
import AddBillDialog from '@/components/AddBillDialog';
import { Bill } from '@/types/finance';

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const initialGroup = mockGroups.find(g => g.id === id);
  const [bills, setBills] = useState<Bill[]>(initialGroup?.bills || []);
  const [showAddBill, setShowAddBill] = useState(false);
  const [activeTab, setActiveTab] = useState<'contas' | 'graficos'>('contas');

  if (!initialGroup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Grupo não encontrado</p>
      </div>
    );
  }

  const toggleStatus = (billId: string) => {
    setBills(prev =>
      prev.map(b =>
        b.id === billId
          ? { ...b, status: b.status === 'pago' ? 'pendente' : 'pago', paidAt: b.status === 'pendente' ? new Date().toISOString().slice(0, 10) : undefined }
          : b
      )
    );
  };

  const addBill = (bill: Omit<Bill, 'id' | 'createdAt'>) => {
    setBills(prev => [
      { ...bill, id: `gb${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10), groupId: id },
      ...prev,
    ]);
  };

  const pendingBills = bills.filter(b => b.status === 'pendente');
  const paidBills = bills.filter(b => b.status === 'pago');

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6 pb-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <button onClick={() => navigate('/groups')} className="flex items-center gap-1 text-muted-foreground text-sm mb-3 hover:text-foreground transition-colors">
            <ArrowLeft size={16} />
            Voltar
          </button>
          <h1 className="text-2xl font-display font-bold">{initialGroup.name}</h1>
          {initialGroup.description && <p className="text-sm text-muted-foreground mt-1">{initialGroup.description}</p>}
        </motion.div>

        {/* Members */}
        <div className="flex items-center gap-3 mt-4">
          <div className="flex -space-x-2">
            {initialGroup.members.slice(0, 5).map((m, i) => (
              <div key={m.id} className="w-8 h-8 rounded-full bg-secondary border-2 border-background flex items-center justify-center text-xs font-medium">
                {m.name.slice(0, 2).toUpperCase()}
              </div>
            ))}
          </div>
          <span className="text-xs text-muted-foreground">{initialGroup.members.length} membros</span>
          <button className="ml-auto flex items-center gap-1 text-primary text-xs font-medium">
            <UserPlus size={14} />
            Convidar
          </button>
        </div>
      </div>

      {/* Tabs */}
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
        {activeTab === 'contas' ? (
          <div className="space-y-3">
            <button
              onClick={() => setShowAddBill(true)}
              className="w-full glass-card p-3 flex items-center justify-center gap-2 text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
            >
              <Plus size={18} />
              Nova Conta
            </button>

            {pendingBills.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-4 mb-2">Pendentes</p>
                {pendingBills.map(bill => <BillCard key={bill.id} bill={bill} onToggleStatus={toggleStatus} />)}
              </>
            )}
            {paidBills.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-4 mb-2">Pagas</p>
                {paidBills.map(bill => <BillCard key={bill.id} bill={bill} onToggleStatus={toggleStatus} />)}
              </>
            )}
          </div>
        ) : (
          <FinanceCharts bills={bills} monthlyData={mockMonthlyData} />
        )}
      </div>

      <AddBillDialog open={showAddBill} onOpenChange={setShowAddBill} onAdd={addBill} />
    </div>
  );
};

export default GroupDetail;
