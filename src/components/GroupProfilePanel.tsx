import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Users, Crown, LogOut, Trash2, Edit2, Check, UserPlus, Shield } from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

interface Member {
  id: string;
  user_id: string;
  role: string;
  profiles?: {
    display_name?: string | null;
    avatar_url?: string | null;
    email?: string | null;
  } | null;
}

interface GroupProfilePanelProps {
  open: boolean;
  onClose: () => void;
  group: {
    id: string;
    name: string;
    description: string | null;
    created_by: string;
    created_at: string;
    image_url?: string | null;
  };
  members: Member[];
  onInvite: () => void;
  onLeaveGroup?: () => void;
  onDeleteGroup?: () => void;
}

const GroupProfilePanel = ({ open, onClose, group, members, onInvite, onLeaveGroup, onDeleteGroup }: GroupProfilePanelProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingName, setEditingName] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || '');
  const [uploading, setUploading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'leave' | 'delete' | 'remove' | null>(null);
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);

  const isAdmin = members.find(m => m.user_id === user?.id)?.role === 'admin';
  const isCreator = group.created_by === user?.id;
  const createdDate = new Date(group.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem deve ter no máximo 5MB'); return; }

    setUploading(true);
    try {
      const filePath = `groups/${group.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('attachments').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(filePath);
      const { error } = await supabase.from('groups').update({ image_url: urlData.publicUrl } as Record<string, unknown>).eq('id', group.id);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['group', group.id] });
      toast.success('Imagem do grupo atualizada!');
    } catch {
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveName = async () => {
    if (!name.trim()) return;
    try {
      const { error } = await supabase.from('groups').update({ name: name.trim() }).eq('id', group.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['group', group.id] });
      setEditingName(false);
      toast.success('Nome atualizado!');
    } catch { toast.error('Erro ao atualizar nome'); }
  };

  const handleSaveDesc = async () => {
    try {
      const { error } = await supabase.from('groups').update({ description: description.trim() || null }).eq('id', group.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['group', group.id] });
      setEditingDesc(false);
      toast.success('Descrição atualizada!');
    } catch { toast.error('Erro ao atualizar descrição'); }
  };

  const handleRemoveMember = async () => {
    if (!removeMemberId) return;
    try {
      const { error } = await supabase.from('group_members').delete().eq('id', removeMemberId);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['group-members', group.id] });
      toast.success('Membro removido!');
    } catch { toast.error('Erro ao remover membro'); }
    setRemoveMemberId(null);
    setConfirmAction(null);
  };

  const sortedMembers = [...members].sort((a, b) => {
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (b.role === 'admin' && a.role !== 'admin') return 1;
    return 0;
  });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 px-4 py-3 flex items-center gap-3 border-b border-border">
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                <X size={20} />
              </button>
              <h2 className="font-display font-semibold text-lg">Dados do grupo</h2>
            </div>

            {/* Group Image */}
            <div className="flex flex-col items-center pt-8 pb-4">
              <div className="relative group">
                {(group as Record<string, unknown>).image_url ? (
                  <img
                    src={(group as Record<string, unknown>).image_url as string}
                    alt={group.name}
                    className="w-28 h-28 rounded-full object-cover border-4 border-primary/20"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full gradient-primary flex items-center justify-center border-4 border-primary/20">
                    <Users size={40} className="text-primary-foreground" />
                  </div>
                )}
                {isAdmin && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="absolute bottom-1 right-1 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
                  >
                    <Camera size={16} />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              {/* Group Name */}
              <div className="mt-4 flex items-center gap-2 px-6 w-full justify-center">
                {editingName ? (
                  <div className="flex items-center gap-2 w-full max-w-xs">
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="flex-1 bg-muted rounded-lg px-3 py-2 text-center text-lg font-display font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                    />
                    <button onClick={handleSaveName} className="p-1.5 rounded-full bg-primary text-primary-foreground">
                      <Check size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-display font-bold">{group.name}</h3>
                    {isAdmin && (
                      <button onClick={() => setEditingName(true)} className="p-1.5 rounded-full hover:bg-muted transition-colors text-muted-foreground">
                        <Edit2 size={14} />
                      </button>
                    )}
                  </>
                )}
              </div>

              <p className="text-sm text-muted-foreground mt-1">Grupo · {members.length} participantes</p>
              <p className="text-xs text-muted-foreground mt-0.5">Criado em {createdDate}</p>
            </div>

            {/* Description */}
            <div className="mx-4 glass-card p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Descrição</p>
                {isAdmin && !editingDesc && (
                  <button onClick={() => setEditingDesc(true)} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground">
                    <Edit2 size={12} />
                  </button>
                )}
              </div>
              {editingDesc ? (
                <div className="space-y-2">
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full bg-muted rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                    autoFocus
                    placeholder="Adicione uma descrição..."
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { setEditingDesc(false); setDescription(group.description || ''); }} className="px-3 py-1.5 text-xs rounded-lg bg-muted hover:bg-accent transition-colors">Cancelar</button>
                    <button onClick={handleSaveDesc} className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Salvar</button>
                  </div>
                </div>
              ) : (
                <p className="text-sm">{group.description || 'Nenhuma descrição'}</p>
              )}
            </div>

            {/* Members */}
            <div className="mx-4 glass-card mb-4 overflow-hidden">
              <div className="flex items-center justify-between p-4 pb-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                  {members.length} participantes
                </p>
                {isAdmin && (
                  <button onClick={onInvite} className="flex items-center gap-1 text-primary text-xs font-medium hover:underline">
                    <UserPlus size={14} /> Adicionar
                  </button>
                )}
              </div>

              <div className="divide-y divide-border">
                {sortedMembers.map(member => {
                  const profile = member.profiles;
                  const isSelf = member.user_id === user?.id;
                  const memberIsCreator = member.user_id === group.created_by;

                  return (
                    <div key={member.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors">
                      <UserAvatar
                        url={profile?.avatar_url || null}
                        name={profile?.display_name || null}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {profile?.display_name || profile?.email || 'Membro'}
                            {isSelf && <span className="text-muted-foreground ml-1">(Você)</span>}
                          </p>
                        </div>
                        {profile?.email && (
                          <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {member.role === 'admin' && (
                          <span className="flex items-center gap-1 text-xs bg-primary/15 text-primary px-2 py-0.5 rounded-full">
                            {memberIsCreator ? <Crown size={10} /> : <Shield size={10} />}
                            Admin
                          </span>
                        )}
                        {isAdmin && !isSelf && !memberIsCreator && (
                          <button
                            onClick={() => { setRemoveMemberId(member.id); setConfirmAction('remove'); }}
                            className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title="Remover membro"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="mx-4 mb-8 space-y-2">
              {!isCreator && (
                <button
                  onClick={() => setConfirmAction('leave')}
                  className="w-full glass-card p-4 flex items-center gap-3 text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut size={18} />
                  <span className="text-sm font-medium">Sair do grupo</span>
                </button>
              )}
              {isCreator && (
                <button
                  onClick={() => setConfirmAction('delete')}
                  className="w-full glass-card p-4 flex items-center gap-3 text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={18} />
                  <span className="text-sm font-medium">Excluir grupo</span>
                </button>
              )}
            </div>

            {/* Confirm Dialog */}
            <AlertDialog open={!!confirmAction} onOpenChange={open => { if (!open) { setConfirmAction(null); setRemoveMemberId(null); } }}>
              <AlertDialogContent className="bg-card border-border text-foreground max-w-sm mx-auto">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display">
                    {confirmAction === 'leave' && 'Sair do grupo'}
                    {confirmAction === 'delete' && 'Excluir grupo'}
                    {confirmAction === 'remove' && 'Remover membro'}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">
                    {confirmAction === 'leave' && 'Tem certeza que deseja sair deste grupo? Você perderá acesso às contas compartilhadas.'}
                    {confirmAction === 'delete' && 'Tem certeza que deseja excluir este grupo? Todas as contas e membros serão removidos permanentemente.'}
                    {confirmAction === 'remove' && 'Tem certeza que deseja remover este membro do grupo?'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex gap-2">
                  <AlertDialogCancel className="flex-1">Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (confirmAction === 'leave') onLeaveGroup?.();
                      else if (confirmAction === 'delete') onDeleteGroup?.();
                      else if (confirmAction === 'remove') handleRemoveMember();
                    }}
                    className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {confirmAction === 'remove' ? 'Remover' : confirmAction === 'delete' ? 'Excluir' : 'Sair'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GroupProfilePanel;
