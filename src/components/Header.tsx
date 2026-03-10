import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import appIcon from '@/assets/japaguei-icon.png';

const Header = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const initials = profile?.display_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || '';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 md:hidden">
      <div className="max-w-4xl mx-auto flex items-center justify-between h-14 px-4">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 shrink-0"
          aria-label="Ir para o início"
        >
          <img src={appIcon} alt="JáPaguei" className="w-8 h-8 rounded-lg" />
        </button>

        <h1 className="text-base font-display font-bold tracking-tight text-foreground">
          JáPaguei
        </h1>

        <div className="shrink-0">
          {user ? (
            <button onClick={() => navigate('/profile')} aria-label="Ir para o perfil">
              <Avatar className="h-9 w-9 ring-2 ring-primary/20 hover:ring-primary/50 transition-all cursor-pointer">
                {profile?.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={profile.display_name || 'Perfil'} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                  {initials || '?'}
                </AvatarFallback>
              </Avatar>
            </button>
          ) : (
            <span className="w-9" />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;