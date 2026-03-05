import { Bill, Group, GroupMember } from '@/types/finance';

const members: GroupMember[] = [
  { id: '1', name: 'Alexandre', email: 'alex@mail.com', role: 'admin' },
  { id: '2', name: 'Victor', email: 'victor@mail.com', role: 'member' },
  { id: '3', name: 'Raimundo', email: 'rai@mail.com', role: 'member' },
  { id: '4', name: 'Glauco', email: 'glauco@mail.com', role: 'member' },
  { id: '5', name: 'Pedro', email: 'pedro@mail.com', role: 'member' },
];

export const mockPersonalBills: Bill[] = [
  { id: 'p1', description: 'Energia elétrica', amount: 185.50, dueDate: '2026-03-15', category: 'energia', status: 'pendente', recurrence: 'mensal', createdAt: '2026-03-01' },
  { id: 'p2', description: 'Internet fibra', amount: 119.90, dueDate: '2026-03-10', category: 'internet', status: 'pago', recurrence: 'mensal', createdAt: '2026-03-01', paidAt: '2026-03-09' },
  { id: 'p3', description: 'Água e esgoto', amount: 95.00, dueDate: '2026-03-20', category: 'agua', status: 'pendente', recurrence: 'mensal', createdAt: '2026-03-01' },
  { id: 'p4', description: 'Aluguel apartamento', amount: 1800.00, dueDate: '2026-03-05', category: 'aluguel', status: 'pago', recurrence: 'mensal', createdAt: '2026-03-01', paidAt: '2026-03-04' },
  { id: 'p5', description: 'Supermercado', amount: 450.00, dueDate: '2026-03-12', category: 'mercado', status: 'pendente', recurrence: 'unica', createdAt: '2026-03-01' },
  { id: 'p6', description: 'Produtos de limpeza', amount: 78.90, dueDate: '2026-03-18', category: 'limpeza', status: 'pendente', recurrence: 'unica', createdAt: '2026-03-01' },
];

export const mockGroups: Group[] = [
  {
    id: 'g1',
    name: 'Apartamento Centro',
    description: 'Contas do apê',
    createdAt: '2026-01-01',
    members,
    bills: [
      { id: 'gb1', description: 'Aluguel', amount: 3200.00, dueDate: '2026-03-05', category: 'aluguel', status: 'pago', recurrence: 'mensal', createdAt: '2026-03-01', paidAt: '2026-03-04', groupId: 'g1', responsibleId: '1' },
      { id: 'gb2', description: 'Energia', amount: 320.00, dueDate: '2026-03-15', category: 'energia', status: 'pendente', recurrence: 'mensal', createdAt: '2026-03-01', groupId: 'g1', responsibleId: '2' },
      { id: 'gb3', description: 'Internet', amount: 150.00, dueDate: '2026-03-10', category: 'internet', status: 'pago', recurrence: 'mensal', createdAt: '2026-03-01', paidAt: '2026-03-09', groupId: 'g1', responsibleId: '3' },
      { id: 'gb4', description: 'Água', amount: 180.00, dueDate: '2026-03-20', category: 'agua', status: 'pendente', recurrence: 'mensal', createdAt: '2026-03-01', groupId: 'g1', responsibleId: '4' },
    ],
  },
];

export const mockMonthlyData = [
  { month: 'Out', total: 2400, paid: 2100, pending: 300 },
  { month: 'Nov', total: 2650, paid: 2300, pending: 350 },
  { month: 'Dez', total: 3100, paid: 2800, pending: 300 },
  { month: 'Jan', total: 2800, paid: 2500, pending: 300 },
  { month: 'Fev', total: 2550, paid: 2200, pending: 350 },
  { month: 'Mar', total: 2729, paid: 1919, pending: 810 },
];
