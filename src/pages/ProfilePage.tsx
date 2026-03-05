import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Settings, LogOut, Bell, Shield, Edit2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatUserName } from '@/lib/utils';
import ShareAppSection from '@/components/ShareAppSection';
import EditProfileDialog from '@/components/EditProfileDialog';

const ProfilePage = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [showEditProfile, setShowEditProfile] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const menuItems = [
    { icon: Bell, label: 'Notificações', desc: 'Alertas de vencimento', path: '/notifications' },
    { icon: Shield, label: 'Segurança', desc: 'Senha e autenticação', path: '/security' },
    { icon: Settings, label: 'Configurações', desc: 'Preferências do app', path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6 pb-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold">Perfil</h1>
        </motion.div>
      </div>

      <div className="px-4">
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

        <div className="space-y-2">
          {menuItems.map((item, i) => (
            <motion.button key={item.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} onClick={() => navigate(item.path)} className="w-full glass-card p-4 flex items-center gap-3 text-left hover:bg-card/90 transition-colors">
              <item.icon size={18} className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </motion.button>
          ))}

          <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} onClick={handleSignOut} className="w-full glass-card p-4 flex items-center gap-3 text-left text-destructive hover:bg-destructive/10 transition-colors mt-4">
            <LogOut size={18} />
            <p className="text-sm font-medium">Sair da conta</p>
          </motion.button>
        </div>

        <div className="mt-6">
          <ShareAppSection />
        </div>
      </div>

      <EditProfileDialog open={showEditProfile} onOpenChange={setShowEditProfile} />
    </div>
  );
};

export default ProfilePage;