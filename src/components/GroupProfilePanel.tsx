import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Camera, Users, Crown, LogOut, Trash2, Edit2, Check, UserPlus,
  Shield, Link2, Copy, ChevronRight, Settings, Info, ShieldCheck, ShieldOff
} from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
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
    invite_code?: string | null;
    admin_only_edit?: boolean;
  };
  members: Member[];
  onInvite: () => void;
  onLeaveGroup?: () => void;
  onDeleteGroup?: () => void;
}

type ConfirmAction = 'leave' | 'delete' | 'remove' | 'promote' | 'demote' | null;

const GroupProfilePanel = ({ open, onClose, group, members, onInvite, onLeaveGroup, onDeleteGroup }: GroupProfilePanelProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingName, setEditingName] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || '');
  const [uploading, setUploading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [targetMember, setTargetMember] = useState<Member | null>(null);
  const [activeSection, setActiveSection] = useState<'info' | 'members' | 'settings' | null>(null);

  // Sync local state when group prop changes
  useEffect(() => {
    setName(group.name);
    setDescription(group.description || '');
  }, [group.name, group.description]);

  const currentMember = members.find(m => m.user_id === user?.id);
  const isAdmin = currentMember?.role === 'admin';
  const isCreator = group.created_by === user?.id;
  const createdDate = new Date(group.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  const adminCount = members.filter(m => m.role === 'admin').length;

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
      toast.success('Imagem atualizada!');
    } catch { toast.error('Erro ao enviar imagem'); }
    finally { setUploading(false); }
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
    if (!targetMember) return;
    try {
      const { error } = await supabase.from('group_members').delete().eq('id', targetMember.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['group-members', group.id] });
      toast.success('Membro removido!');
    } catch (err) {
      console.error('[GroupProfilePanel] remove member error:', err);
      toast.error('Erro ao remover membro');
    }
    setTargetMember(null);
    setConfirmAction(null);
  };

  const handlePromoteDemote = async () => {
    if (!targetMember) return;
    const newRole = confirmAction === 'promote' ? 'admin' : 'member';
    try {
      const { error } = await supabase.from('group_members').update({ role: newRole }).eq('id', targetMember.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['group-members', group.id] });
      toast.success(newRole === 'admin' ? 'Membro promovido a admin!' : 'Admin rebaixado a membro!');
    } catch (err) {
      console.error('[GroupProfilePanel] promote/demote error:', err);
      toast.error('Erro ao alterar função');
    }
    setTargetMember(null);
    setConfirmAction(null);
  };

  const handleCopyInviteLink = () => {
    const code = (group as Record<string, unknown>).invite_code as string | undefined;
    if (!code) { toast.error('Código de convite não disponível'); return; }
    const link = `${window.location.origin}/groups/join/${code}`;
    navigator.clipboard.writeText(link);
    toast.success('Link de convite copiado!');
  };

  const sortedMembers = [...members].sort((a, b) => {
    const creatorA = a.user_id === group.created_by ? -2 : 0;
    const creatorB = b.user_id === group.created_by ? -2 : 0;
    const adminA = a.role === 'admin' ? -1 : 0;
    const adminB = b.role === 'admin' ? -1 : 0;
    return (creatorA + adminA) - (creatorB + adminB);
  });

  const confirmMessages: Record<string, { title: string; desc: string; btn: string }> = {
    leave: { title: 'Sair do grupo', desc: 'Tem certeza que deseja sair? Você perderá acesso às contas compartilhadas.', btn: 'Sair' },
    delete: { title: 'Excluir grupo', desc: 'Tem certeza? Todas as contas e membros serão removidos permanentemente.', btn: 'Excluir' },
    remove: { title: 'Remover membro', desc: `Tem certeza que deseja remover ${targetMember?.profiles?.display_name || 'este membro'} do grupo?`, btn: 'Remover' },
    promote: { title: 'Promover a admin', desc: `${targetMember?.profiles?.display_name || 'Este membro'} poderá editar o grupo e gerenciar participantes.`, btn: 'Promover' },
    demote: { title: 'Remover admin', desc: `${targetMember?.profiles?.display_name || 'Este admin'} perderá privilégios de administrador.`, btn: 'Rebaixar' },
  };

  const handleConfirmAction = () => {
    if (confirmAction === 'leave') onLeaveGroup?.();
    else if (confirmAction === 'delete') onDeleteGroup?.();
    else if (confirmAction === 'remove') handleRemoveMember();
    else if (confirmAction === 'promote' || confirmAction === 'demote') handlePromoteDemote();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background z-50 overflow-y-auto flex flex-col"
          >
            {/* Header */}
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-10 px-4 py-3 flex items-center gap-3 border-b border-border">
              <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted transition-colors">
                <X size={20} />
              </button>
              <h2 className="font-display font-semibold text-lg">Info do grupo</h2>
            </div>

            {/* Group Avatar & Name */}
            <div className="flex flex-col items-center pt-8 pb-6 px-6">
              <div className="relative group">
                {group.image_url ? (
                  <img src={group.image_url} alt={group.name} className="w-32 h-32 rounded-full object-cover border-4 border-primary/20" />
                ) : (
                  <div className="w-32 h-32 rounded-full gradient-primary flex items-center justify-center border-4 border-primary/20">
                    <Users size={48} className="text-primary-foreground" />
                  </div>
                )}
                {isAdmin && (
                  <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                    className="absolute bottom-1 right-1 p-2.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors">
                    <Camera size={18} />
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </div>

              <div className="mt-4 flex items-center gap-2 w-full justify-center">
                {editingName ? (
                  <div className="flex items-center gap-2 w-full max-w-xs">
                    <input value={name} onChange={e => setName(e.target.value.slice(0, 100))} autoFocus
                      onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                      className="flex-1 bg-muted rounded-lg px-3 py-2 text-center text-lg font-display font-bold focus:outline-none focus:ring-2 focus:ring-primary" />
                    <button onClick={handleSaveName} className="p-1.5 rounded-full bg-primary text-primary-foreground"><Check size={14} /></button>
                    <button onClick={() => { setEditingName(false); setName(group.name); }} className="p-1.5 rounded-full hover:bg-muted"><X size={14} /></button>
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
              <p className="text-sm text-muted-foreground mt-1">Grupo · {members.length} participante{members.length !== 1 ? 's' : ''}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Criado em {createdDate}</p>
            </div>

            {/* Quick Nav Sections */}
            <div className="px-4 space-y-1.5 mb-4">
              {/* Description Section */}
              <div className="glass-card overflow-hidden">
                <button onClick={() => setActiveSection(activeSection === 'info' ? null : 'info')}
                  className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
                  <Info size={18} className="text-primary shrink-0" />
                  <span className="text-sm font-medium flex-1 text-left">Descrição</span>
                  <ChevronRight size={16} className={`text-muted-foreground transition-transform ${activeSection === 'info' ? 'rotate-90' : ''}`} />
                </button>
                <AnimatePresence>
                  {activeSection === 'info' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-4 pb-4">
                        {editingDesc ? (
                          <div className="space-y-2">
                            <textarea value={description} onChange={e => setDescription(e.target.value.slice(0, 500))}
                              className="w-full bg-muted rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                              rows={3} autoFocus placeholder="Adicione uma descrição..." />
                            <p className="text-xs text-muted-foreground text-right">{description.length}/500</p>
                            <div className="flex gap-2 justify-end">
                              <button onClick={() => { setEditingDesc(false); setDescription(group.description || ''); }}
                                className="px-3 py-1.5 text-xs rounded-lg bg-muted hover:bg-accent transition-colors">Cancelar</button>
                              <button onClick={handleSaveDesc}
                                className="px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">Salvar</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2">
                            <p className="text-sm flex-1">{group.description || 'Nenhuma descrição adicionada.'}</p>
                            {isAdmin && (
                              <button onClick={() => setEditingDesc(true)} className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground shrink-0">
                                <Edit2 size={12} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Members Section */}
              <div className="glass-card overflow-hidden">
                <button onClick={() => setActiveSection(activeSection === 'members' ? null : 'members')}
                  className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
                  <Users size={18} className="text-primary shrink-0" />
                  <span className="text-sm font-medium flex-1 text-left">{members.length} participante{members.length !== 1 ? 's' : ''}</span>
                  <ChevronRight size={16} className={`text-muted-foreground transition-transform ${activeSection === 'members' ? 'rotate-90' : ''}`} />
                </button>
                <AnimatePresence>
                  {activeSection === 'members' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="pb-2">
                        {/* Add member button */}
                        {isAdmin && (
                          <button onClick={onInvite} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-primary">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <UserPlus size={18} />
                            </div>
                            <span className="text-sm font-medium">Adicionar participante</span>
                          </button>
                        )}

                        {/* Invite link button */}
                        <button onClick={handleCopyInviteLink} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-primary">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Link2 size={18} />
                          </div>
                          <div className="text-left flex-1">
                            <span className="text-sm font-medium">Link de convite do grupo</span>
                            <p className="text-xs text-muted-foreground">Copie e compartilhe</p>
                          </div>
                          <Copy size={14} className="text-muted-foreground" />
                        </button>

                        <div className="h-px bg-border mx-4 my-1" />

                        {/* Members list */}
                        {sortedMembers.map(member => {
                          const profile = member.profiles;
                          const isSelf = member.user_id === user?.id;
                          const memberIsCreator = member.user_id === group.created_by;
                          const memberIsAdmin = member.role === 'admin';

                          return (
                            <div key={member.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors group/member">
                              <UserAvatar url={profile?.avatar_url || null} name={profile?.display_name || null} size="md" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium truncate">
                                    {profile?.display_name || profile?.email || 'Membro'}
                                    {isSelf && <span className="text-muted-foreground ml-1 text-xs">(Você)</span>}
                                  </p>
                                </div>
                                {profile?.email && <p className="text-xs text-muted-foreground truncate">{profile.email}</p>}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                {memberIsCreator && (
                                  <span className="flex items-center gap-1 text-[10px] bg-amber-500/15 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium">
                                    <Crown size={10} /> Criador
                                  </span>
                                )}
                                {memberIsAdmin && !memberIsCreator && (
                                  <span className="flex items-center gap-1 text-[10px] bg-primary/15 text-primary px-2 py-0.5 rounded-full font-medium">
                                    <Shield size={10} /> Admin
                                  </span>
                                )}
                                {/* Admin actions on other members */}
                                {isAdmin && !isSelf && !memberIsCreator && (
                                  <div className="flex items-center gap-0.5">
                                    {memberIsAdmin ? (
                                      <button onClick={() => { setTargetMember(member); setConfirmAction('demote'); }}
                                        title="Remover admin" className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                                        <ShieldOff size={14} />
                                      </button>
                                    ) : (
                                      <button onClick={() => { setTargetMember(member); setConfirmAction('promote'); }}
                                        title="Promover a admin" className="p-1.5 rounded-full hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                                        <ShieldCheck size={14} />
                                      </button>
                                    )}
                                    <button onClick={() => { setTargetMember(member); setConfirmAction('remove'); }}
                                      title="Remover membro" className="p-1.5 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                                      <X size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Settings Section (admin only) */}
              {isAdmin && (
                <div className="glass-card overflow-hidden">
                  <button onClick={() => setActiveSection(activeSection === 'settings' ? null : 'settings')}
                    className="w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors">
                    <Settings size={18} className="text-primary shrink-0" />
                    <span className="text-sm font-medium flex-1 text-left">Configurações do grupo</span>
                    <ChevronRight size={16} className={`text-muted-foreground transition-transform ${activeSection === 'settings' ? 'rotate-90' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {activeSection === 'settings' && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="px-4 pb-4 space-y-3">
                          <div className="flex items-center justify-between py-2">
                            <div>
                              <p className="text-sm font-medium">Editar info do grupo</p>
                              <p className="text-xs text-muted-foreground">Quem pode editar nome, foto e descrição</p>
                            </div>
                            <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                              {group.admin_only_edit !== false ? 'Só admins' : 'Todos'}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <p>• {adminCount} administrador{adminCount !== 1 ? 'es' : ''}</p>
                            <p>• {members.length - adminCount} membro{members.length - adminCount !== 1 ? 's' : ''} comum{members.length - adminCount !== 1 ? 'ns' : ''}</p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-4 mb-8 space-y-1.5 mt-auto pt-4">
              {!isCreator && (
                <button onClick={() => setConfirmAction('leave')}
                  className="w-full glass-card p-4 flex items-center gap-3 text-destructive hover:bg-destructive/10 transition-colors rounded-xl">
                  <LogOut size={18} />
                  <span className="text-sm font-medium">Sair do grupo</span>
                </button>
              )}
              {isCreator && (
                <button onClick={() => setConfirmAction('delete')}
                  className="w-full glass-card p-4 flex items-center gap-3 text-destructive hover:bg-destructive/10 transition-colors rounded-xl">
                  <Trash2 size={18} />
                  <span className="text-sm font-medium">Excluir grupo</span>
                </button>
              )}
            </div>

            {/* Confirm Dialog */}
            <AlertDialog open={!!confirmAction} onOpenChange={open => { if (!open) { setConfirmAction(null); setTargetMember(null); } }}>
              <AlertDialogContent className="bg-card border-border text-foreground max-w-sm mx-auto">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display">{confirmAction && confirmMessages[confirmAction]?.title}</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground">{confirmAction && confirmMessages[confirmAction]?.desc}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex gap-2">
                  <AlertDialogCancel className="flex-1">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmAction}
                    className={`flex-1 ${confirmAction === 'promote' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'}`}>
                    {confirmAction && confirmMessages[confirmAction]?.btn}
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
