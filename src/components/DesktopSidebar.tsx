import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, UserCheck, Clock, User } from 'lucide-react';
import appIcon from '@/assets/japaguei-icon.png';

const navItems = [
  { to: '/', icon: Home, label: 'Início' },
  { to: '/groups', icon: Users, label: 'Grupos' },
  { to: '/friends', icon: UserCheck, label: 'Amigos' },
  { to: '/history', icon: Clock, label: 'Histórico' },
  { to: '/profile', icon: User, label: 'Perfil' },
];

const DesktopSidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-card/80 backdrop-blur-xl border-r border-border/50 fixed left-0 top-0 bottom-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-border/50">
        <img src={appIcon} alt="JáPaguei" className="w-10 h-10 rounded-xl" />
        <h1 className="text-xl font-display font-bold text-foreground">JáPaguei</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to || 
            (to !== '/' && location.pathname.startsWith(to));
          return (
            <NavLink
              key={to}
              to={to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-primary' : ''} />
              {label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground">© 2026 JáPaguei</p>
      </div>
    </aside>
  );
};

export default DesktopSidebar;
