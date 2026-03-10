import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Users, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const JoinGroupPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'joining' | 'success' | 'error' | 'already'>('loading');
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // Redirect to login with return path
      navigate(`/login?redirect=${encodeURIComponent(`/groups/join/${code}`)}`, { replace: true });
      return;
    }

    const joinGroup = async () => {
      try {
        // Find group by invite_code
        const { data: group, error: groupError } = await supabase
          .from('groups')
          .select('id, name')
          .eq('invite_code', code!)
          .maybeSingle();

        if (groupError || !group) {
          setStatus('error');
          return;
        }

        setGroupName(group.name);

        // Check if already a member
        const { data: existing } = await supabase
          .from('group_members')
          .select('id')
          .eq('group_id', group.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (existing) {
          setStatus('already');
          setTimeout(() => navigate(`/groups/${group.id}`, { replace: true }), 1500);
          return;
        }

        setStatus('joining');

        // Join the group
        const { error: joinError } = await supabase
          .from('group_members')
          .insert({ group_id: group.id, user_id: user.id, role: 'member' });

        if (joinError) {
          console.error('Join error:', joinError);
          setStatus('error');
          return;
        }

        setStatus('success');
        toast.success(`Você entrou no grupo "${group.name}"!`);
        setTimeout(() => navigate(`/groups/${group.id}`, { replace: true }), 1500);
      } catch {
        setStatus('error');
      }
    };

    joinGroup();
  }, [code, user, authLoading, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center space-y-6">
        {(status === 'loading' || status === 'joining') && (
          <>
            <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto">
              <Users size={36} className="text-primary-foreground" />
            </div>
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">
              {status === 'loading' ? 'Verificando convite...' : `Entrando no grupo "${groupName}"...`}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} className="text-emerald-500" />
            </div>
            <h1 className="text-xl font-display font-bold">Bem-vindo!</h1>
            <p className="text-sm text-muted-foreground">Você entrou no grupo "{groupName}". Redirecionando...</p>
          </>
        )}

        {status === 'already' && (
          <>
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Users size={40} className="text-primary" />
            </div>
            <h1 className="text-xl font-display font-bold">Já é membro!</h1>
            <p className="text-sm text-muted-foreground">Você já faz parte de "{groupName}". Redirecionando...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <XCircle size={40} className="text-destructive" />
            </div>
            <h1 className="text-xl font-display font-bold">Link inválido</h1>
            <p className="text-sm text-muted-foreground">Este link de convite é inválido ou expirou.</p>
            <Button onClick={() => navigate('/groups')} variant="outline" className="w-full">
              Ir para Grupos
            </Button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default JoinGroupPage;
