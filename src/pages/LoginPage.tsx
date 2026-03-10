import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

type View = 'login' | 'signup' | 'forgot';

const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectTo = searchParams.get('redirect') || '/';
  const isFriendInvite = redirectTo.startsWith('/add-friend');
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (!validateEmail(trimmedEmail)) {
      toast.error('Email inválido');
      return;
    }
    if (password.length > 128) {
      toast.error('Senha muito longa');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: trimmedEmail, password });
    setLoading(false);
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Email ou senha incorretos');
      } else {
        toast.error(error.message);
      }
    } else {
      navigate(redirectTo, { replace: true });
    }
  };

  const handleSignUp = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = displayName.trim();
    if (!trimmedEmail || !password || !trimmedName) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (!validateEmail(trimmedEmail)) {
      toast.error('Email inválido');
      return;
    }
    if (trimmedName.length > 100) {
      toast.error('Nome deve ter no máximo 100 caracteres');
      return;
    }
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    if (password.length > 128) {
      toast.error('Senha muito longa');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          full_name: trimmedName,
          name: trimmedName,
        },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Conta criada com sucesso!');
      navigate(redirectTo, { replace: true });
    }
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      toast.error('Digite seu email');
      return;
    }
    if (!validateEmail(trimmedEmail)) {
      toast.error('Email inválido');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setResetSent(true);
      toast.success('Email de recuperação enviado!');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (view === 'forgot') handleForgotPassword();
    else if (view === 'signup') handleSignUp();
    else handleLogin();
  };

  const switchView = (newView: View) => {
    setView(newView);
    setPassword('');
    setConfirmPassword('');
    setResetSent(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl font-display font-bold text-primary-foreground">$</span>
          </div>
          <h1 className="text-3xl font-display font-bold mb-2">JáPaguei</h1>
          {view === 'forgot' ? (
            <p className="text-muted-foreground text-sm">
              Digite seu email para receber um link de recuperação de senha.
            </p>
          ) : isFriendInvite ? (
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 mb-2">
              <p className="text-sm text-primary font-medium">👋 Alguém quer te adicionar como amigo!</p>
              <p className="text-xs text-muted-foreground mt-1">
                {view === 'signup' ? 'Crie sua conta' : 'Faça login'} para aceitar a solicitação de amizade.
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Organize suas contas pessoais e em grupo de forma simples e visual.
            </p>
          )}
        </div>

        {view === 'forgot' && resetSent ? (
          <div className="glass-card p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <span className="text-2xl">✉️</span>
            </div>
            <p className="text-sm text-foreground font-medium">Email enviado!</p>
            <p className="text-xs text-muted-foreground">
              Verifique sua caixa de entrada (e spam) para o link de recuperação de senha.
            </p>
            <Button
              variant="outline"
              onClick={() => switchView('login')}
              className="w-full"
            >
              <ArrowLeft size={14} className="mr-2" /> Voltar ao login
            </Button>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-4">
              {view === 'signup' && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Nome</Label>
                  <Input
                    type="text"
                    placeholder="Seu nome"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">Email</Label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary border-border text-foreground"
                />
              </div>

              {view !== 'forgot' && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Senha</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-secondary border-border text-foreground pr-10"
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
              )}

              {view === 'signup' && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Confirmar senha</Label>
                  <Input
                    type="password"
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-secondary border-border text-foreground"
                  />
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full gradient-primary text-primary-foreground font-semibold py-3 rounded-xl hover:opacity-90"
              >
                {loading ? 'Aguarde...' : view === 'forgot' ? 'Enviar link de recuperação' : view === 'signup' ? 'Criar Conta' : 'Entrar'}
              </Button>
            </form>

            {/* Forgot password link (only on login view) */}
            {view === 'login' && (
              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={() => switchView('forgot')}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Esqueceu sua senha?
                </button>
              </div>
            )}

            {/* Back to login (on forgot view) */}
            {view === 'forgot' && (
              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 mx-auto"
                >
                  <ArrowLeft size={14} /> Voltar ao login
                </button>
              </div>
            )}

            {/* Toggle login/signup */}
            {view !== 'forgot' && (
              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={() => switchView(view === 'signup' ? 'login' : 'signup')}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {view === 'signup' ? 'Já tem conta? Fazer login' : 'Não tem conta? Criar conta'}
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default LoginPage;