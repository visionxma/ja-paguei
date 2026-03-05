import { motion } from 'framer-motion';
import { User, Settings, LogOut, Bell, Shield } from 'lucide-react';

const ProfilePage = () => {
  const menuItems = [
    { icon: Bell, label: 'Notificações', desc: 'Alertas de vencimento' },
    { icon: Shield, label: 'Segurança', desc: 'Senha e autenticação' },
    { icon: Settings, label: 'Configurações', desc: 'Preferências do app' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6 pb-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold">Perfil</h1>
        </motion.div>
      </div>

      <div className="px-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-5 flex items-center gap-4 mb-6"
        >
          <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center">
            <User size={24} className="text-primary-foreground" />
          </div>
          <div>
            <p className="font-display font-semibold">Usuário</p>
            <p className="text-sm text-muted-foreground">usuario@email.com</p>
          </div>
        </motion.div>

        <div className="space-y-2">
          {menuItems.map((item, i) => (
            <motion.button
              key={item.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="w-full glass-card p-4 flex items-center gap-3 text-left hover:bg-card/90 transition-colors"
            >
              <item.icon size={18} className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </motion.button>
          ))}

          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full glass-card p-4 flex items-center gap-3 text-left text-destructive hover:bg-destructive/10 transition-colors mt-4"
          >
            <LogOut size={18} />
            <p className="text-sm font-medium">Sair da conta</p>
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
