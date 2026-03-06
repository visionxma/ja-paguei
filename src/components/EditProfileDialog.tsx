import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigationGuard } from '@/contexts/NavigationGuardContext';
import { supabase } from '@/integrations/supabase/client';
import { formatUserName } from '@/lib/utils';
import { toast } from 'sonner';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditProfileDialog = ({ open, onOpenChange }: EditProfileDialogProps) => {
  const { user, profile, refreshProfile } = useAuth();
  const { setDirty } = useNavigationGuard();
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDisplayName(profile?.display_name || '');
    }
  }, [open, profile]);

  const hasChanged = formatUserName(displayName) !== formatUserName(profile?.display_name);
  // Sync navigation guard with dirty state
  useEffect(() => {
    setDirty(hasChanged);
    return () => setDirty(false);
  }, [hasChanged, setDirty]);

  const handleSave = async () => {
    if (!user) return;

    if (!displayName.trim()) {
      toast.error('O nome não pode ficar vazio');
      return;
    }

    setSaving(true);
    try {
      const formatted = formatUserName(displayName);
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: formatted })
        .eq('user_id', user.id);
      if (error) throw error;

      toast.success('Nome atualizado com sucesso');
      await refreshProfile();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar nome');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Editar Nome</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Nome de exibição</Label>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Seu nome"
              className="bg-secondary border-border text-foreground"
            />
            {displayName.trim() && (
              <p className="text-xs text-muted-foreground mt-1">
                Será exibido como: <span className="text-foreground font-medium">{formatUserName(displayName)}</span>
              </p>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || !hasChanged}
            className="w-full"
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
