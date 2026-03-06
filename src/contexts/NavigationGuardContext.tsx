import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useBlocker } from 'react-router-dom';
import UnsavedChangesDialog from '@/components/UnsavedChangesDialog';

interface NavigationGuardContextType {
  setDirty: (dirty: boolean) => void;
}

const NavigationGuardContext = createContext<NavigationGuardContextType>({
  setDirty: () => {},
});

export const useNavigationGuard = () => useContext(NavigationGuardContext);

export const NavigationGuardProvider = ({ children }: { children: ReactNode }) => {
  const [isDirty, setIsDirty] = useState(false);

  const blocker = useBlocker(
    useCallback(() => isDirty, [isDirty])
  );

  const handleStay = useCallback(() => {
    if (blocker.state === 'blocked') {
      blocker.reset();
    }
  }, [blocker]);

  const handleLeave = useCallback(() => {
    setIsDirty(false);
    if (blocker.state === 'blocked') {
      blocker.proceed();
    }
  }, [blocker]);

  const setDirty = useCallback((dirty: boolean) => {
    setIsDirty(dirty);
  }, []);

  return (
    <NavigationGuardContext.Provider value={{ setDirty }}>
      {children}
      <UnsavedChangesDialog
        open={blocker.state === 'blocked'}
        onStay={handleStay}
        onLeave={handleLeave}
      />
    </NavigationGuardContext.Provider>
  );
};
