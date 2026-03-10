import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Moon, Sun, Monitor, DollarSign, Calendar, Bell, BellOff, BellRing } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '@/hooks/usePreferences';
import { useNotificationPermission } from '@/hooks/useNotifications';
import { useTheme } from '@/contexts/ThemeContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface OptionCardProps {
  icon: React.ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const OptionCard = ({ icon, label, selected, onClick, disabled }: OptionCardProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-xs font-medium flex-1 ${
      selected
        ? 'border-primary bg-primary/10 text-primary'
        : 'border-border bg-card/50 text-muted-foreground hover:bg-card'
    }`}
  >
    {icon}
    {label}
  </button>
);

const SettingsPage = () => {
  const navigate = useNavigate();
  const { preferences, isLoading, updatePreference, isSaving } = usePreferences();
  const { theme, setTheme } = useTheme();
  const { permission, isSupported, requestPermission } = useNotificationPermission();
  const [permState, setPermState] = useState(permission);

  useEffect(() => {
    setPermState(permission);
  }, [permission]);

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    setPermState(granted ? 'granted' : 'denied');
    if (granted) {
      toast.success('Notificações ativadas!');
    } else {
      toast.error('Permissão de notificação negada. Ative nas configurações do navegador.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 md:pb-8 px-4 md:px-8 pt-6 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-36 w-full rounded-xl" />
        <Skeleton className="h-36 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="px-4 md:px-8 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate('/profile')} className="p-1.5 rounded-lg hover:bg-card transition-colors">
          <ArrowLeft size={20} />
        </button>
        <motion.h1 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-display font-bold">
          Configurações
        </motion.h1>
      </div>

      <div className="px-4 space-y-4">
        {/* Notifications */}
        {isSupported && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-display font-semibold flex items-center gap-2">
                <BellRing size={16} className="text-primary" />
                Notificações Push
              </h2>
              {permState === 'granted' ? (
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <Bell size={14} /> Ativadas
                </span>
              ) : permState === 'denied' ? (
                <span className="text-xs text-destructive font-medium flex items-center gap-1">
                  <BellOff size={14} /> Bloqueadas
                </span>
              ) : (
                <button
                  onClick={handleEnableNotifications}
                  className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                >
                  Ativar
                </button>
              )}
            </div>

            {permState === 'denied' && (
              <p className="text-xs text-muted-foreground mb-3">
                Notificações bloqueadas. Para reativar, vá às configurações do seu navegador e permita notificações para este site.
              </p>
            )}

            {permState === 'granted' && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  Receba alertas sobre contas próximas do vencimento.
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Contas vencidas</span>
                    <Switch
                      checked={preferences.notify_overdue}
                      onCheckedChange={(v) => updatePreference({ notify_overdue: v })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Vence em 1 dia</span>
                    <Switch
                      checked={preferences.notify_due_1day}
                      onCheckedChange={(v) => updatePreference({ notify_due_1day: v })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Vence em 3 dias</span>
                    <Switch
                      checked={preferences.notify_due_3days}
                      onCheckedChange={(v) => updatePreference({ notify_due_3days: v })}
                      disabled={isSaving}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground">Vence em 7 dias</span>
                    <Switch
                      checked={preferences.notify_due_7days}
                      onCheckedChange={(v) => updatePreference({ notify_due_7days: v })}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Theme */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4">
          <h2 className="text-sm font-display font-semibold mb-3">Tema</h2>
          <div className="flex gap-2">
            <OptionCard icon={<Moon size={18} />} label="Escuro" selected={theme === 'dark'} onClick={() => setTheme('dark')} disabled={isSaving} />
            <OptionCard icon={<Sun size={18} />} label="Claro" selected={theme === 'light'} onClick={() => setTheme('light')} disabled={isSaving} />
            <OptionCard icon={<Monitor size={18} />} label="Sistema" selected={theme === 'system'} onClick={() => setTheme('system')} disabled={isSaving} />
          </div>
        </motion.div>

        {/* Currency */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4">
          <h2 className="text-sm font-display font-semibold mb-3">Moeda</h2>
          <div className="flex gap-2">
            <OptionCard icon={<DollarSign size={18} />} label="R$ (BRL)" selected={preferences.currency === 'BRL'} onClick={() => updatePreference({ currency: 'BRL' })} disabled={isSaving} />
            <OptionCard icon={<DollarSign size={18} />} label="$ (USD)" selected={preferences.currency === 'USD'} onClick={() => updatePreference({ currency: 'USD' })} disabled={isSaving} />
            <OptionCard icon={<DollarSign size={18} />} label="€ (EUR)" selected={preferences.currency === 'EUR'} onClick={() => updatePreference({ currency: 'EUR' })} disabled={isSaving} />
          </div>
        </motion.div>

        {/* Date format */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-4">
          <h2 className="text-sm font-display font-semibold mb-3">Formato de data</h2>
          <div className="flex gap-2">
            <OptionCard icon={<Calendar size={18} />} label="DD/MM/AAAA" selected={preferences.date_format === 'DD/MM/YYYY'} onClick={() => updatePreference({ date_format: 'DD/MM/YYYY' })} disabled={isSaving} />
            <OptionCard icon={<Calendar size={18} />} label="MM/DD/AAAA" selected={preferences.date_format === 'MM/DD/YYYY'} onClick={() => updatePreference({ date_format: 'MM/DD/YYYY' })} disabled={isSaving} />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SettingsPage;
