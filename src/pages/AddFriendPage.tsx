import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, ArrowLeft, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFriends } from '@/hooks/useFriends';
import { formatUserName } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const AddFriendPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sendRequest } = useFriends();
  const userId = searchParams.get('user');
  const [profile, setProfile] = useState<{ user_id: string; display_name: string | null; avatar_url: string | null; email: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const autoSentRef = useRef(false);

  useEffect(() => {
    if (!userId) {
      setError('QR Code inválido.');
      setLoading(false);
      return;
    }
    if (userId === user?.id) {
      setError('Este é o seu próprio QR Code!');
      setLoading(false);
      return;
    }

    supabase.from('profiles').select('user_id, display_name, avatar_url, email').eq('user_id', userId).single()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setError('Usuário não encontrado.');
        } else {
          setProfile(data);
        }
        setLoading(false);
      });
  }, [userId, user]);

  // Auto-send friend request when arriving from login/signup flow
  useEffect(() => {
    if (profile && !sent && !sending && !autoSentRef.current) {
      autoSentRef.current = true;
      handleAdd();
    }
  }, [profile]);

  const handleAdd = async () => {
    if (!profile) return;
    setSending(true);
    const ok = await sendRequest(profile.user_id);
    setSending(false);
    if (ok) setSent(true);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 w-full max-w-sm text-center space-y-4">
        {loading ? (
          <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : error ? (
          <>
            <p className="text-destructive font-medium">{error}</p>
            <Button variant="outline" onClick={() => navigate('/friends')}><ArrowLeft size={16} className="mr-1" /> Voltar</Button>
          </>
        ) : profile ? (
          <>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover mx-auto" />
            ) : (
              <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center mx-auto">
                <User size={32} className="text-primary-foreground" />
              </div>
            )}
            <h2 className="text-lg font-display font-bold">{formatUserName(profile.display_name) || 'Usuário'}</h2>
            {profile.email && <p className="text-sm text-muted-foreground">{profile.email}</p>}

            {sent ? (
              <p className="text-emerald-500 font-medium text-sm">✓ Solicitação enviada!</p>
            ) : (
              <Button onClick={handleAdd} disabled={sending} className="w-full gradient-primary text-primary-foreground">
                <UserPlus size={16} className="mr-2" />
                {sending ? 'Enviando...' : 'Adicionar como amigo'}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => navigate('/friends')} className="text-muted-foreground">
              <ArrowLeft size={14} className="mr-1" /> Voltar
            </Button>
          </>
        ) : null}
      </motion.div>
    </div>
  );
};

export default AddFriendPage;