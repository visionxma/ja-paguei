import { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { inviteToGroup } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useFriends } from '@/hooks/useFriends';
import { formatUserName } from '@/lib/utils';
import UserAvatar from '@/components/UserAvatar';
import { UserPlus, Mail, Users, User, Check } from 'lucide-react';
import { toast } from 'sonner';

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  existingMemberIds?: string[];
}

const InviteMemberDialog = ({ open, onOpenChange, groupId, existingMemberIds = [] }: InviteMemberDialogProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { friends } = useFriends();
  const [email, setEmail] = useState('');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const availableFriends = useMemo(() => {
    return friends.filter(f => !existingMemberIds.includes(f.friend_user_id));
  }, [friends, existingMemberIds]);

  const emailSuggestions = useMemo(() => {
    if (!email.trim() || email.length < 2) return [];
    const q = email.toLowerCase();
    return friends.filter(f => {
      const inGroup = existingMemberIds.includes(f.friend_user_id);
      const matchesEmail = f.email?.toLowerCase().includes(q);
      const matchesName = f.display_name?.toLowerCase().includes(q);
      return !inGroup && (matchesEmail || matchesName);
    }).slice(0, 5);
  }, [email, friends, existingMemberIds]);

  const inviteMutation = useMutation({
    mutationFn: (emailToInvite: string) => inviteToGroup(groupId, emailToInvite, user!.id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] });
      queryClient.invalidateQueries({ queryKey: ['group-invites', groupId] });
      if (result.added) {
        toast.success('Membro adicionado ao grupo!');
      } else {
        toast.success('Convite registrado!');
      }
      setEmail('');
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Erro ao convidar');
    },
  });

  const handleInviteFriend = async (friendUserId: string, friendEmail: string | null) => {
    if (!friendEmail) {
      toast.error('Amigo sem email registrado.');
      return;
    }
    setAddingId(friendUserId);
    try {
      await inviteMutation.mutateAsync(friendEmail);
      setAddedIds(prev => new Set(prev).add(friendUserId));
    } finally {
      setAddingId(null);
    }
  };

  const handleEmailSubmit = () => {
    if (!email.trim()) return;
    inviteMutation.mutate(email.trim());
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setEmail('');
      setAddedIds(new Set());
    }
    onOpenChange(val);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="bottom" className="bg-card border-border text-foreground rounded-t-2xl max-h-[85vh] flex flex-col pb-safe">
        <SheetHeader className="text-left shrink-0">
          <SheetTitle className="font-display text-lg flex items-center gap-2">
            <UserPlus size={18} /> Convidar Membro
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto mt-3">
          <Tabs defaultValue="friends">
            <TabsList className="w-full mb-3">
              <TabsTrigger value="friends" className="flex-1 text-xs">
                <Users size={12} className="mr-1" /> Amigos
              </TabsTrigger>
              <TabsTrigger value="email" className="flex-1 text-xs">
                <Mail size={12} className="mr-1" /> Email
              </TabsTrigger>
            </TabsList>

            <TabsContent value="friends" className="space-y-2 max-h-[50vh] overflow-y-auto">
              {availableFriends.length === 0 ? (
                <div className="text-center py-6">
                  <User size={28} className="mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum amigo disponível para adicionar.</p>
                  <p className="text-xs text-muted-foreground mt-1">Adicione amigos na aba Amigos primeiro.</p>
                </div>
              ) : (
                availableFriends.map(friend => {
                  const isAdded = addedIds.has(friend.friend_user_id);
                  const isAdding = addingId === friend.friend_user_id;
                  return (
                    <div key={friend.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary/50">
                      <UserAvatar url={friend.avatar_url} name={friend.display_name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{formatUserName(friend.display_name) || 'Usuário'}</p>
                        <p className="text-xs text-muted-foreground truncate">{friend.email}</p>
                      </div>
                      {isAdded ? (
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                          <Check size={16} />
                        </div>
                      ) : (
                        <button
                          onClick={() => handleInviteFriend(friend.friend_user_id, friend.email)}
                          disabled={isAdding}
                          className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                        >
                          {isAdding ? (
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <UserPlus size={16} />
                          )}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="email" className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1">
                  <Mail size={12} /> Email do membro
                </Label>
                <Input
                  type="email"
                  placeholder="exemplo@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
                  className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
                  autoComplete="off"
                />
              </div>

              {emailSuggestions.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Sugestões de amigos</p>
                  {emailSuggestions.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setEmail(s.email || '')}
                      className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-secondary/80 transition-colors text-left"
                    >
                      <UserAvatar url={s.avatar_url} name={s.display_name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{formatUserName(s.display_name) || 'Usuário'}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={handleEmailSubmit}
                disabled={!email.trim() || inviteMutation.isPending}
                className="w-full gradient-primary text-primary-foreground font-semibold py-3 rounded-xl disabled:opacity-50"
              >
                {inviteMutation.isPending ? 'Convidando...' : 'Enviar Convite'}
              </button>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default InviteMemberDialog;
