export type BillCategory = 'geral' | 'aluguel' | 'energia' | 'agua' | 'internet' | 'mercado' | 'limpeza' | 'outro';
export type BillStatus = 'pendente' | 'pago';
export type BillRecurrence = 'unica' | 'mensal' | 'anual';

export interface Bill {
  id: string;
  description: string;
  amount: number;
  dueDate?: string;
  category: BillCategory;
  status: BillStatus;
  recurrence: BillRecurrence;
  createdAt: string;
  paidAt?: string;
  notes?: string;
  groupId?: string;
  responsibleId?: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  members: GroupMember[];
  bills: Bill[];
}

export interface GroupMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'member';
}

export interface MonthlyData {
  month: string;
  total: number;
  paid: number;
  pending: number;
}

export interface CategoryData {
  category: string;
  value: number;
  color: string;
}

export const CATEGORY_LABELS: Record<BillCategory, string> = {
  geral: 'Geral',
  aluguel: 'Aluguel',
  energia: 'Energia',
  agua: 'Água',
  internet: 'Internet',
  mercado: 'Mercado',
  limpeza: 'Limpeza',
  outro: 'Outro',
};

export const CATEGORY_COLORS: Record<BillCategory, string> = {
  geral: 'hsl(330, 80%, 55%)',
  aluguel: 'hsl(260, 70%, 60%)',
  energia: 'hsl(45, 90%, 55%)',
  agua: 'hsl(200, 80%, 55%)',
  internet: 'hsl(170, 70%, 50%)',
  mercado: 'hsl(120, 60%, 45%)',
  limpeza: 'hsl(290, 60%, 55%)',
  outro: 'hsl(0, 0%, 50%)',
};
