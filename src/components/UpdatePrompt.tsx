import { useState, useEffect, useCallback } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X } from 'lucide-react';

const UpdatePrompt = () => {
  const [dismissed, setDismissed] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      if (r) {
        // Check for updates every 30 seconds
        setInterval(() => r.update(), 30 * 1000);

        // Also check when app becomes visible (user returns to tab/app)
        const handleVisibility = () => {
          if (document.visibilityState === 'visible') {
            r.update();
          }
        };
        document.addEventListener('visibilitychange', handleVisibility);
      }
    },
  });

  // Reset dismissed when a new update arrives
  useEffect(() => {
    if (needRefresh) setDismissed(false);
  }, [needRefresh]);

  const handleUpdate = useCallback(() => {
    updateServiceWorker(true);
  }, [updateServiceWorker]);

  const showPrompt = needRefresh && !dismissed;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          className="fixed bottom-20 left-4 right-4 z-[60] max-w-lg mx-auto bg-card border border-border rounded-2xl shadow-2xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <RefreshCw size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Nova versão disponível</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Uma nova versão do aplicativo está disponível.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
                >
                  Atualizar agora
                </button>
                <button
                  onClick={() => setDismissed(true)}
                  className="px-4 py-2 rounded-xl bg-secondary text-secondary-foreground text-xs font-medium hover:bg-secondary/80 transition-colors"
                >
                  Depois
                </button>
              </div>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpdatePrompt;
