import { Bill, CATEGORY_COLORS, CATEGORY_LABELS, BillCategory } from '@/types/finance';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FinanceChartsProps {
  bills: Bill[];
  monthlyData: { month: string; total: number; paid: number; pending: number }[];
}

const FinanceCharts = ({ bills, monthlyData }: FinanceChartsProps) => {
  const categoryData = Object.entries(
    bills.reduce((acc, bill) => {
      acc[bill.category] = (acc[bill.category] || 0) + bill.amount;
      return acc;
    }, {} as Record<string, number>)
  ).map(([category, value]) => ({
    name: CATEGORY_LABELS[category as BillCategory],
    value,
    color: CATEGORY_COLORS[category as BillCategory],
  }));

  const totalPaid = bills.filter(b => b.status === 'pago').reduce((s, b) => s + b.amount, 0);
  const totalPending = bills.filter(b => b.status === 'pendente').reduce((s, b) => s + b.amount, 0);
  const total = totalPaid + totalPending;

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="glass-card p-3 text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
          <p className="text-sm font-bold mt-1">{formatCurrency(total)}</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-[10px] text-success uppercase tracking-wider">Pago</p>
          <p className="text-sm font-bold text-success mt-1">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-[10px] text-warning uppercase tracking-wider">Pendente</p>
          <p className="text-sm font-bold text-warning mt-1">{formatCurrency(totalPending)}</p>
        </div>
      </div>

      {/* Category Pie Chart */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-display font-semibold mb-3">Gastos por Categoria</h3>
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={55} strokeWidth={0}>
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-1.5">
            {categoryData.map((d, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span className="text-muted-foreground">{d.name}</span>
                </div>
                <span className="font-medium">{formatCurrency(d.value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Bar Chart */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-display font-semibold mb-3">Evolução Mensal</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 10%, 18%)" />
            <XAxis dataKey="month" tick={{ fill: 'hsl(240, 5%, 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'hsl(240, 5%, 55%)', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
            <Tooltip
              contentStyle={{ background: 'hsl(240, 12%, 10%)', border: '1px solid hsl(240, 10%, 18%)', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: 'hsl(0, 0%, 95%)' }}
            />
            <Bar dataKey="paid" fill="hsl(150, 60%, 45%)" radius={[4, 4, 0, 0]} name="Pago" />
            <Bar dataKey="pending" fill="hsl(40, 90%, 55%)" radius={[4, 4, 0, 0]} name="Pendente" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FinanceCharts;
