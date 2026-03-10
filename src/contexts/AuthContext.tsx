import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { formatUserName } from '@/lib/utils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: { display_name: string | null; avatar_url: string | null; email: string | null } | null;
  isPasswordRecovery: boolean;
  clearPasswordRecovery: () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  profile: null,
  isPasswordRecovery: false,
  clearPasswordRecovery: () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const initialSessionChecked = useRef(false);

  const clearPasswordRecovery = useCallback(() => setIsPasswordRecovery(false), []);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, avatar_url, email')
      .eq('user_id', userId)
      .single();
    if (data) {
      setProfile({
        ...data,
        display_name: formatUserName(data.display_name),
      });
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.id);
  }, [user, fetchProfile]);

  useEffect(() => {
    // First: get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
      initialSessionChecked.current = true;
    });

    // Then: listen for auth changes (only process after initial check)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!initialSessionChecked.current) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchProfile(session.user.id), 0);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, profile, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};