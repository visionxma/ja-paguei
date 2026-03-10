import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, KeyRound, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const SecurityPage = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) {
      toast.error(error.message || 'Erro ao alterar senha');
    } else {
      toast.success('Senha alterada com sucesso');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleSignOutAll = async () => {
    setLoggingOut(true);
    const { error } = await supabase.auth.signOut({ scope: 'global' });
    setLoggingOut(false);
    if (error) {
      toast.error('Erro ao encerrar sessões');
    } else {
      toast.success('Todas as sessões foram encerradas');
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="px-4 md:px-8 pt-6 pb-4 flex items-center gap-3">
        <button onClick={() => navigate('/profile')} className="p-1.5 rounded-lg hover:bg-card transition-colors">
          <ArrowLeft size={20} />
        </button>
        <motion.h1 initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-2xl font-display font-bold">
          Segurança
        </motion.h1>
      </div>

      <div className="px-4 space-y-4">
        {/* Password change */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 space-y-4">
          <div className="flex items-center gap-2">
            <KeyRound size={16} className="text-primary" />
            <h2 className="text-sm font-display font-semibold">Alterar senha</h2>
          </div>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-muted-foreground">Nova senha</Label>
              <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Mínimo 6 caracteres" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Confirmar nova senha</Label>
              <Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repita a nova senha" className="mt-1" />
            </div>
            <Button onClick={handleChangePassword} disabled={saving || !newPassword} className="w-full">
              {saving ? 'Salvando...' : 'Alterar senha'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Nota: esta opção funciona apenas para contas com login por e-mail e senha.
          </p>
        </motion.div>

        {/* Sign out all */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <LogOut size={16} className="text-destructive" />
            <h2 className="text-sm font-display font-semibold">Sessões</h2>
          </div>
          <p className="text-xs text-muted-foreground">
            Encerre todas as sessões ativas em todos os dispositivos. Você precisará fazer login novamente.
          </p>
          <Button variant="destructive" onClick={handleSignOutAll} disabled={loggingOut} className="w-full">
            {loggingOut ? 'Encerrando...' : 'Encerrar todas as sessões'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default SecurityPage;
