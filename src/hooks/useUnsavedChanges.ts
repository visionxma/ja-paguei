import { useEffect, useCallback, useRef } from 'react';
import { useBeforeUnload } from 'react-router-dom';

const STORAGE_PREFIX = 'unsaved_form_';

interface UseUnsavedChangesOptions {
  formId: string;
  isDirty: boolean;
  formData?: Record<string, any>;
  message?: string;
}

/**
 * Hook that:
 * 1. Warns on browser close/refresh if there are unsaved changes
 * 2. Persists form data to sessionStorage for restoration
 */
export const useUnsavedChanges = ({
  formId,
  isDirty,
  formData,
  message = 'Você possui informações não salvas. Deseja realmente sair?',
}: UseUnsavedChangesOptions) => {
  const storageKey = `${STORAGE_PREFIX}${formId}`;

  // Warn on browser refresh/close
  useBeforeUnload(
    useCallback(
      (e: BeforeUnloadEvent) => {
        if (isDirty) {
          e.preventDefault();
        }
      },
      [isDirty]
    )
  );

  // Persist form data to sessionStorage
  useEffect(() => {
    if (isDirty && formData) {
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(formData));
      } catch {
        // Storage full or unavailable
      }
    }
  }, [isDirty, formData, storageKey]);

  // Clear on unmount if not dirty (saved successfully)
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  const clearSaved = useCallback(() => {
    sessionStorage.removeItem(storageKey);
  }, [storageKey]);

  // Restore saved form data
  const restoreData = useCallback((): Record<string, any> | null => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        sessionStorage.removeItem(storageKey);
        return parsed;
      }
    } catch {
      // Parse error
    }
    return null;
  }, [storageKey]);

  return { clearSaved, restoreData, isDirty };
};
