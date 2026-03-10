import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '@/hooks/usePreferences';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';

interface ToggleRowProps {
  label: string;
  desc: string;
  checked: boolean;
  onToggle: (v: boolean) => void;
  disabled?: boolean;
}

const ToggleRow = ({ label, desc, checked, onToggle, disabled }: ToggleRowProps) => (
  <div className="flex items-center justify-between py-3">
    <div className="pr-4">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onToggle} disabled={disabled} />
  </div>
);

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { preferences, isLoading, updatePreference, isSaving } = usePreferences();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8 px-4 md:px-8 pt-6 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate('/profile')} className="p-1.5 rounded-lg hover:bg-card transition-colors">
          <ArrowLeft size={20} />
        </button>
        <motion.h1 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-display font-bold">
          Notificações
        </motion.h1>
      </div>

      <div className="px-4 space-y-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell size={16} className="text-primary" />
            <h2 className="text-sm font-display font-semibold">Vencimento de contas</h2>
          </div>
          <div className="divide-y divide-border">
            <ToggleRow label="1 dia antes" desc="Alerta um dia antes do vencimento" checked={preferences.notify_due_1day} onToggle={(v) => updatePreference({ notify_due_1day: v })} disabled={isSaving} />
            <ToggleRow label="3 dias antes" desc="Alerta três dias antes do vencimento" checked={preferences.notify_due_3days} onToggle={(v) => updatePreference({ notify_due_3days: v })} disabled={isSaving} />
            <ToggleRow label="7 dias antes" desc="Alerta uma semana antes do vencimento" checked={preferences.notify_due_7days} onToggle={(v) => updatePreference({ notify_due_7days: v })} disabled={isSaving} />
            <ToggleRow label="Contas vencidas" desc="Alerta quando uma conta vencer" checked={preferences.notify_overdue} onToggle={(v) => updatePreference({ notify_overdue: v })} disabled={isSaving} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Users size={16} className="text-primary" />
            <h2 className="text-sm font-display font-semibold">Atividades de grupo</h2>
          </div>
          <div className="divide-y divide-border">
            <ToggleRow label="Nova conta no grupo" desc="Quando alguém criar uma conta" checked={preferences.notify_group_new_bill} onToggle={(v) => updatePreference({ notify_group_new_bill: v })} disabled={isSaving} />
            <ToggleRow label="Conta alterada" desc="Quando uma conta for editada" checked={preferences.notify_group_bill_changed} onToggle={(v) => updatePreference({ notify_group_bill_changed: v })} disabled={isSaving} />
            <ToggleRow label="Novo membro" desc="Quando alguém entrar no grupo" checked={preferences.notify_group_new_member} onToggle={(v) => updatePreference({ notify_group_new_member: v })} disabled={isSaving} />
            <ToggleRow label="Conta paga" desc="Quando uma conta for marcada como paga" checked={preferences.notify_group_bill_paid} onToggle={(v) => updatePreference({ notify_group_bill_paid: v })} disabled={isSaving} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotificationsPage;
