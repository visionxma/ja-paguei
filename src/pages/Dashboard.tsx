import { useState } from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import BillCard from '@/components/BillCard';
import FinanceCharts from '@/components/FinanceCharts';
import AddBillDialog from '@/components/AddBillDialog';
import { mockPersonalBills, mockMonthlyData } from '@/data/mockData';
import { Bill } from '@/types/finance';

const Dashboard = () => {
  const [bills, setBills] = useState<Bill[]>(mockPersonalBills);
  const [showAddBill, setShowAddBill] = useState(false);
  const [activeTab, setActiveTab] = useState<'contas' | 'graficos'>('contas');

  const toggleStatus = (id: string) => {
    setBills(prev =>
      prev.map(b =>
        b.id === id
          ? { ...b, status: b.status === 'pago' ? 'pendente' : 'pago', paidAt: b.status === 'pendente' ? new Date().toISOString().slice(0, 10) : undefined }
          : b
      )
    );
  };

  const addBill = (bill: Omit<Bill, 'id' | 'createdAt'>) => {
    setBills(prev => [
      { ...bill, id: `p${Date.now()}`, createdAt: new Date().toISOString().slice(0, 10) },
      ...prev,
    ]);
  };

  const pendingBills = bills.filter(b => b.status === 'pendente');
  const paidBills = bills.filter(b => b.status === 'pago');
  const totalPending = pendingBills.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-sm text-muted-foreground">Olá 👋</p>
          <h1 className="text-2xl font-display font-bold mt-1">Minhas Contas</h1>
        </motion.div>

        {/* Summary */}
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

      {/* Tabs */}
      <div className="px-4 flex gap-2 mb-4">
        {(['contas', 'graficos'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {tab === 'contas' ? 'Contas' : 'Gráficos'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-4">
        {activeTab === 'contas' ? (
          <div className="space-y-3">
            {/* Add button */}
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
                {pendingBills.map(bill => (
                  <BillCard key={bill.id} bill={bill} onToggleStatus={toggleStatus} />
                ))}
              </>
            )}

            {paidBills.length > 0 && (
              <>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mt-4 mb-2">Pagas</p>
                {paidBills.map(bill => (
                  <BillCard key={bill.id} bill={bill} onToggleStatus={toggleStatus} />
                ))}
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

export default Dashboard;
