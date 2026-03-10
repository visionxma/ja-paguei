import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, UserCheck, Clock, User } from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Início' },
  { to: '/groups', icon: Users, label: 'Grupos' },
  { to: '/friends', icon: UserCheck, label: 'Amigos' },
  { to: '/history', icon: Clock, label: 'Histórico' },
  { to: '/profile', icon: User, label: 'Perfil' },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border safe-bottom md:hidden">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={to}
              to={to}
              className="flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition-colors"
            >
              <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-primary/20' : ''}`}>
                <Icon
                  size={18}
                  className={isActive ? 'text-primary' : 'text-muted-foreground'}
                />
              </div>
              <span className={`text-[9px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
