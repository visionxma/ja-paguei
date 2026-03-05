import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, UserCheck, UserX, Trash2, Mail, QrCode, Users } from 'lucide-react';
import { useFriends } from '@/hooks/useFriends';
import { formatUserName } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const FriendsPage = () => {
  const { friends, pendingReceived, pendingSent, loading, sendRequestByEmail, acceptRequest, rejectRequest, removeFriend } = useFriends();
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const navigate = useNavigate();

  const handleSendByEmail = async () => {
    if (!email.trim()) return;
    setSending(true);
    await sendRequestByEmail(email.trim());
    setEmail('');
    setSending(false);
  };

  const Avatar = ({ url, name }: { url: string | null; name: string | null }) => (
    url ? (
      <img src={url} alt="" className="w-10 h-10 rounded-full object-cover" />
    ) : (
      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
        {(name || '?')[0]?.toUpperCase()}
      </div>
    )
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6 pb-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <h1 className="text-2xl font-display font-bold">Amigos</h1>
          <button
            onClick={() => navigate('/scan-friend')}
            className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            title="Escanear QR Code"
          >
            <QrCode size={20} />
          </button>
        </motion.div>
      </div>

      <div className="px-4 space-y-4">
        {/* Pending Requests */}
        {pendingReceived.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
              <UserPlus size={14} /> Solicitações recebidas ({pendingReceived.length})
            </h2>
            <div className="space-y-2">
              {pendingReceived.map(req => (
                <div key={req.id} className="glass-card p-3 flex items-center gap-3">
                  <Avatar url={req.avatar_url} name={req.display_name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{formatUserName(req.display_name) || req.email || 'Usuário'}</p>
                  </div>
                  <button onClick={() => acceptRequest(req.id)} className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors" title="Aceitar">
                    <UserCheck size={16} />
                  </button>
                  <button onClick={() => rejectRequest(req.id)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors" title="Recusar">
                    <UserX size={16} />
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Add Friend Section */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
            <UserPlus size={14} /> Adicionar amigo
          </h2>
          <div className="glass-card p-3 space-y-3">
            <Tabs defaultValue="email">
              <TabsList className="w-full">
                <TabsTrigger value="email" className="flex-1 text-xs"><Mail size={12} className="mr-1" /> Email</TabsTrigger>
                <TabsTrigger value="qr" className="flex-1 text-xs"><QrCode size={12} className="mr-1" /> QR Code</TabsTrigger>
              </TabsList>
              <TabsContent value="email" className="mt-3">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="bg-secondary border-border text-sm"
                    onKeyDown={e => e.key === 'Enter' && handleSendByEmail()}
                  />
                  <Button onClick={handleSendByEmail} disabled={sending || !email.trim()} size="sm" className="shrink-0">
                    Enviar
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="qr" className="mt-3">
                <button
                  onClick={() => navigate('/scan-friend')}
                  className="w-full glass-card p-4 flex flex-col items-center gap-2 hover:bg-primary/5 transition-colors"
                >
                  <QrCode size={32} className="text-primary" />
                  <p className="text-sm font-medium">Escanear QR Code de amizade</p>
                  <p className="text-xs text-muted-foreground">Abra a câmera para escanear o QR Code de um amigo</p>
                </button>
              </TabsContent>
            </Tabs>
          </div>
        </motion.div>

        {/* Pending Sent */}
        {pendingSent.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">Enviadas ({pendingSent.length})</h2>
            <div className="space-y-2">
              {pendingSent.map(req => (
                <div key={req.id} className="glass-card p-3 flex items-center gap-3 opacity-70">
                  <Avatar url={req.avatar_url} name={req.display_name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{formatUserName(req.display_name) || req.email || 'Usuário'}</p>
                    <p className="text-xs text-muted-foreground">Aguardando resposta</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Friends List */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
            <Users size={14} /> Meus amigos ({friends.length})
          </h2>
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : friends.length === 0 ? (
            <div className="glass-card p-6 text-center">
              <Users size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum amigo ainda.</p>
              <p className="text-xs text-muted-foreground mt-1">Adicione amigos por email ou QR Code!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map(friend => (
                <div key={friend.id} className="glass-card p-3 flex items-center gap-3">
                  <Avatar url={friend.avatar_url} name={friend.display_name} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{formatUserName(friend.display_name) || friend.email || 'Usuário'}</p>
                    <p className="text-xs text-muted-foreground truncate">{friend.email}</p>
                  </div>
                  <button onClick={() => removeFriend(friend.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Remover amigo">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default FriendsPage;
