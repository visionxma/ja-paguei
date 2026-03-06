import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface NavigationGuardContextType {
  setDirty: (dirty: boolean) => void;
}

const NavigationGuardContext = createContext<NavigationGuardContextType>({
  setDirty: () => {},
});

export const useNavigationGuard = () => useContext(NavigationGuardContext);

export const NavigationGuardProvider = ({ children }: { children: ReactNode }) => {
  const [isDirty, setIsDirty] = useState(false);

  // Warn on browser close/refresh
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const setDirty = useCallback((dirty: boolean) => {
    setIsDirty(dirty);
  }, []);

  return (
    <NavigationGuardContext.Provider value={{ setDirty }}>
      {children}
    </NavigationGuardContext.Provider>
  );
};
