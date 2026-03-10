import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, KeyRound } from 'lucide-react';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasRecoveryToken, setHasRecoveryToken] = useState(false);

  useEffect(() => {
    // Check for recovery token in URL hash
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setHasRecoveryToken(true);
    }

    // Also listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setHasRecoveryToken(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleReset = async () => {
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (password.length > 128) {
      toast.error('A senha deve ter no máximo 128 caracteres');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast.error(error.message || 'Erro ao redefinir senha');
    } else {
      setSuccess(true);
      toast.success('Senha redefinida com sucesso!');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-2xl font-display font-bold">Senha redefinida!</h1>
          <p className="text-sm text-muted-foreground">Sua senha foi alterada com sucesso. Você já pode usar a nova senha.</p>
          <Button onClick={() => navigate('/')} className="w-full gradient-primary text-primary-foreground">
            Ir para o início
          </Button>
        </motion.div>
      </div>
    );
  }

  if (!hasRecoveryToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-display font-bold">Link inválido</h1>
          <p className="text-sm text-muted-foreground">
            Este link de recuperação é inválido ou expirou. Solicite um novo link na tela de login.
          </p>
          <Button onClick={() => navigate('/login')} variant="outline" className="w-full">
            Voltar ao login
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <KeyRound size={28} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold mb-2">Nova senha</h1>
          <p className="text-sm text-muted-foreground">Digite sua nova senha abaixo.</p>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleReset(); }} className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Nova senha</Label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-secondary border-border text-foreground pr-10"
                maxLength={128}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Confirmar nova senha</Label>
            <Input
              type="password"
              placeholder="Repita a nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-secondary border-border text-foreground"
              maxLength={128}
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !password}
            className="w-full gradient-primary text-primary-foreground font-semibold py-3 rounded-xl"
          >
            {loading ? 'Salvando...' : 'Redefinir senha'}
          </Button>
        </form>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;
