import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import appIcon from '@/assets/japaguei-icon.png';

const Header = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const firstName = profile?.display_name?.split(' ')[0] || '';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-lg mx-auto flex items-center justify-between h-14 px-4">
        {/* Left: App icon */}
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 shrink-0"
          aria-label="Ir para o início"
        >
          <img src={appIcon} alt="JáPaguei" className="w-8 h-8 rounded-lg" />
        </button>

        {/* Center: App name */}
        <h1 className="text-base font-display font-bold tracking-tight text-foreground">
          JáPaguei
        </h1>

        {/* Right: Greeting */}
        <div className="shrink-0 text-right">
          {user && firstName ? (
            <span className="text-sm text-muted-foreground">
              Olá, <span className="text-foreground font-medium">{firstName}</span>
            </span>
          ) : (
            <span className="w-8" />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;