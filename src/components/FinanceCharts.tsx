import { Bill, CATEGORY_COLORS, CATEGORY_LABELS, BillCategory } from '@/types/finance';
import { PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FinanceChartsProps {
  bills: Bill[];
  monthlyData: { month: string; total: number; paid: number; pending: number }[];
}

const FinanceCharts = ({ bills, monthlyData }: FinanceChartsProps) => {
  const categoryData = Object.entries(
    bills.reduce((acc, bill) => {
      acc[bill.category] = (acc[bill.category] || 0) + Number(bill.amount);
      return acc;
    }, {} as Record<string, number>)
  ).map(([category, value]) => ({
    name: CATEGORY_LABELS[category as BillCategory] || category,
    value,
    color: CATEGORY_COLORS[category as BillCategory] || 'hsl(0,0%,50%)',
  }));

  const totalPaid = bills.filter(b => b.status === 'pago').reduce((s, b) => s + Number(b.amount), 0);
  const totalPending = bills.filter(b => b.status === 'pendente').reduce((s, b) => s + Number(b.amount), 0);
  const total = totalPaid + totalPending;

  const statusData = [
    { name: 'Pago', value: totalPaid, color: 'hsl(150, 60%, 45%)' },
    { name: 'Pendente', value: totalPending, color: 'hsl(40, 90%, 55%)' },
  ].filter(d => d.value > 0);

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

      {/* Paid vs Pending Pie */}
      {statusData.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-display font-semibold mb-3">Pagas vs Pendentes</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={statusData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={55} strokeWidth={0}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {statusData.map((d, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span className="text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(d.value)}</span>
                </div>
              ))}
              <div className="text-xs text-muted-foreground pt-1 border-t border-border/50">
                {totalPaid > 0 && total > 0 ? `${Math.round((totalPaid / total) * 100)}% pago` : ''}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Pie Chart */}
      {categoryData.length > 0 && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-display font-semibold mb-3">Gastos por Categoria</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={55} strokeWidth={0}>
                  {categoryData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
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
      )}

      {/* Monthly Area Chart - Evolução Mensal */}
      {monthlyData.length > 0 ? (
        <div className="glass-card p-4">
          <h3 className="text-sm font-display font-semibold mb-3">Evolução Mensal</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(265, 80%, 60%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(265, 80%, 60%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 10%, 18%)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fill: 'hsl(240, 5%, 55%)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: 'hsl(240, 5%, 55%)', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={45}
                tickFormatter={(v: number) =>
                  v >= 1000 ? `R$${(v / 1000).toFixed(0)}k` : `R$${v}`
                }
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(240, 12%, 10%)',
                  border: '1px solid hsl(240, 10%, 22%)',
                  borderRadius: 12,
                  fontSize: 12,
                  padding: '8px 12px',
                  boxShadow: '0 8px 24px hsl(0 0% 0% / 0.4)',
                }}
                labelStyle={{ color: 'hsl(0, 0%, 95%)', fontWeight: 600, marginBottom: 4 }}
                formatter={(value: number) => [formatCurrency(value), 'Total']}
                cursor={{ stroke: 'hsl(265, 80%, 60%)', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="hsl(265, 80%, 60%)"
                strokeWidth={2.5}
                fill="url(#gradTotal)"
                dot={{ fill: 'hsl(265, 80%, 60%)', r: 4, strokeWidth: 2, stroke: 'hsl(240, 12%, 10%)' }}
                activeDot={{ r: 6, fill: 'hsl(265, 80%, 70%)', stroke: 'hsl(240, 12%, 10%)', strokeWidth: 2 }}
                animationDuration={1200}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="glass-card p-8 text-center">
          <p className="text-muted-foreground text-sm">Nenhum dado disponível para evolução mensal.</p>
        </div>
      )}

      {/* Line Chart - Evolution */}
      {monthlyData.length > 1 && (
        <div className="glass-card p-4">
          <h3 className="text-sm font-display font-semibold mb-3">Tendência de Gastos</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 10%, 18%)" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(240, 5%, 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(240, 5%, 55%)', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
              <Tooltip contentStyle={{ background: 'hsl(240, 12%, 10%)', border: '1px solid hsl(240, 10%, 18%)', borderRadius: 8, fontSize: 12 }} labelStyle={{ color: 'hsl(0, 0%, 95%)' }} />
              <Line type="monotone" dataKey="total" stroke="hsl(330, 80%, 55%)" strokeWidth={2} dot={{ fill: 'hsl(330, 80%, 55%)', r: 4 }} name="Total" />
              <Line type="monotone" dataKey="paid" stroke="hsl(150, 60%, 45%)" strokeWidth={2} dot={{ fill: 'hsl(150, 60%, 45%)', r: 4 }} name="Pago" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {bills.length === 0 && (
        <div className="glass-card p-8 text-center">
          <p className="text-muted-foreground text-sm">Adicione contas para visualizar os gráficos.</p>
        </div>
      )}
    </div>
  );
};

export default FinanceCharts;
