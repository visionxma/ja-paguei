import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inviteToGroup } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { UserPlus, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
}

const InviteMemberDialog = ({ open, onOpenChange, groupId }: InviteMemberDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('');

  const inviteMutation = useMutation({
    mutationFn: () => inviteToGroup(groupId, email, user!.id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-invites', groupId] });
      if (result.added) {
        toast.success('Membro adicionado ao grupo!');
      } else {
        toast.success('Convite registrado! O usuário será adicionado quando criar uma conta.');
      }
      setEmail('');
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao convidar');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <UserPlus size={18} /> Convidar Membro
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Adicione alguém ao grupo pelo email.
          </p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1">
              <Mail size={12} /> Email do membro
            </Label>
            <Input
              type="email"
              placeholder="exemplo@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <button
            onClick={() => inviteMutation.mutate()}
            disabled={!email || inviteMutation.isPending}
            className="w-full gradient-primary text-primary-foreground font-semibold py-3 rounded-xl disabled:opacity-50"
          >
            {inviteMutation.isPending ? 'Convidando...' : 'Enviar Convite'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteMemberDialog;
