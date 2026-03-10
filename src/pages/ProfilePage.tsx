import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Settings, LogOut, Bell, Shield, Edit2, Copy, Check, ExternalLink, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatUserName } from '@/lib/utils';
import ShareAppSection from '@/components/ShareAppSection';
import EditProfileDialog from '@/components/EditProfileDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const APP_URL = 'https://ja-paguei.lovable.app';

const ProfilePage = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [copiedFriend, setCopiedFriend] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const friendQRValue = user ? `${APP_URL}/add-friend?user=${user.id}` : '';

  const handleCopyFriendLink = async () => {
    try {
      await navigator.clipboard.writeText(friendQRValue);
      setCopiedFriend(true);
      const { toast } = await import('sonner');
      toast.success('Link de amizade copiado!');
      setTimeout(() => setCopiedFriend(false), 2000);
    } catch {
      const { toast } = await import('sonner');
      toast.error('Não foi possível copiar o link');
    }
  };

  const handleShareFriendLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Me adicione como amigo!',
          text: 'Use este link para me adicionar como amigo no Já Paguei.',
          url: friendQRValue,
        });
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') handleCopyFriendLink();
      }
    } else {
      handleCopyFriendLink();
    }
  };

  const menuItems = [
    { icon: Bell, label: 'Notificações', desc: 'Alertas de vencimento', path: '/notifications' },
    { icon: Shield, label: 'Segurança', desc: 'Senha e autenticação', path: '/security' },
    { icon: Settings, label: 'Configurações', desc: 'Preferências do app', path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="px-4 md:px-8 pt-6 pb-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold">Perfil</h1>
        </motion.div>
      </div>

      <div className="px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5 flex items-center gap-4 mb-6 relative">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center">
              <User size={24} className="text-primary-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold">{formatUserName(profile?.display_name) || 'Usuário'}</p>
            <p className="text-sm text-muted-foreground truncate">{profile?.email}</p>
          </div>
          <button
            onClick={() => setShowEditProfile(true)}
            className="p-2 rounded-lg hover:bg-primary/10 transition-colors text-primary"
            aria-label="Editar nome"
            title="Editar nome"
          >
            <Edit2 size={16} />
          </button>
        </motion.div>

        {/* QR Codes Section */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
          <Tabs defaultValue="friend" className="glass-card p-4">
            <TabsList className="w-full mb-3">
              <TabsTrigger value="friend" className="flex-1 text-xs">QR de Amizade</TabsTrigger>
              <TabsTrigger value="app" className="flex-1 text-xs">QR do App</TabsTrigger>
            </TabsList>
            <TabsContent value="friend" className="space-y-4">
              <div className="flex justify-center py-3">
                <div className="bg-white p-3 rounded-xl">
                  <QRCodeSVG value={friendQRValue} size={160} level="H" />
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Peça para um amigo escanear este QR Code para te adicionar
              </p>

              {/* Link + Copy */}
              <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2.5">
                <ExternalLink size={14} className="text-muted-foreground shrink-0" />
                <span className="text-xs text-muted-foreground truncate flex-1">{friendQRValue}</span>
                <button
                  onClick={handleCopyFriendLink}
                  className="shrink-0 p-1.5 rounded-md hover:bg-accent transition-colors"
                >
                  {copiedFriend ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-muted-foreground" />}
                </button>
              </div>

              {/* Share button */}
              <button
                onClick={handleShareFriendLink}
                className="w-full flex items-center justify-center gap-2 gradient-primary text-primary-foreground rounded-lg py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
              >
                <Share2 size={16} />
                Compartilhar link de amizade
              </button>
            </TabsContent>
            <TabsContent value="app">
              <ShareAppSection />
            </TabsContent>
          </Tabs>
        </motion.div>

        <div className="space-y-2">
          {menuItems.map((item, i) => (
            <motion.button key={item.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 + 0.1 }} onClick={() => navigate(item.path)} className="w-full glass-card p-4 flex items-center gap-3 text-left hover:bg-card/90 transition-colors">
              <item.icon size={18} className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </motion.button>
          ))}

          <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} onClick={handleSignOut} className="w-full glass-card p-4 flex items-center gap-3 text-left text-destructive hover:bg-destructive/10 transition-colors mt-4">
            <LogOut size={18} />
            <p className="text-sm font-medium">Sair da conta</p>
          </motion.button>
        </div>
      </div>

      <EditProfileDialog open={showEditProfile} onOpenChange={setShowEditProfile} />
    </div>
  );
};

export default ProfilePage;
