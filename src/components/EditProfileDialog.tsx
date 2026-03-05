import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { formatUserName } from '@/lib/utils';
import { toast } from 'sonner';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EditProfileDialog = ({ open, onOpenChange }: EditProfileDialogProps) => {
  const { user, profile, refreshProfile } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setDisplayName(profile?.display_name || '');
      setNewEmail(profile?.email || '');
    }
  }, [open, profile]);

  const hasNameChanged = formatUserName(displayName) !== formatUserName(profile?.display_name);
  const hasEmailChanged = newEmail.trim().toLowerCase() !== (profile?.email || '').toLowerCase();
  const hasChanges = hasNameChanged || hasEmailChanged;

  const handleSave = async () => {
    if (!user) return;

    if (hasEmailChanged && !emailRegex.test(newEmail.trim())) {
      toast.error('Digite um e-mail válido');
      return;
    }

    if (!displayName.trim()) {
      toast.error('O nome não pode ficar vazio');
      return;
    }

    setSaving(true);
    try {
      // Update display name in profiles table
      if (hasNameChanged) {
        const formatted = formatUserName(displayName);
        const { error } = await supabase
          .from('profiles')
          .update({ display_name: formatted })
          .eq('user_id', user.id);
        if (error) throw error;
      }

      // Update email via auth
      if (hasEmailChanged) {
        const { error } = await supabase.auth.updateUser({ email: newEmail.trim().toLowerCase() });
        if (error) throw error;
        toast.success('Um e-mail de confirmação foi enviado para o novo endereço');
      }

      if (hasNameChanged && !hasEmailChanged) {
        toast.success('Perfil atualizado com sucesso');
      }

      if (hasNameChanged) {
        await refreshProfile();
      }

      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Editar Perfil</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Nome</Label>
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

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">E-mail</Label>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="seu@email.com"
              className="bg-secondary border-border text-foreground"
            />
            {hasEmailChanged && newEmail.trim() && !emailRegex.test(newEmail.trim()) && (
              <p className="text-xs text-destructive mt-1">E-mail inválido</p>
            )}
            {hasEmailChanged && emailRegex.test(newEmail.trim()) && (
              <p className="text-xs text-muted-foreground mt-1">
                Um e-mail de confirmação será enviado para o novo endereço.
              </p>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="w-full"
          >
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
