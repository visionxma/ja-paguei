import { useState, useRef } from 'react';
import { Plus, Users, ChevronRight, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useFormat } from '@/contexts/FormatContext';
import { fetchGroups, createGroup, fetchGroupBills } from '@/lib/api';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import UserAvatar from '@/components/UserAvatar';

const GroupsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { formatCurrency } = useFormat();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: groupMemberships = [], isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
    enabled: !!user,
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Imagem deve ter no máximo 5MB'); return; }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) { toast.error('Nome do grupo é obrigatório'); return; }
    if (trimmed.length < 2) { toast.error('Nome deve ter pelo menos 2 caracteres'); return; }
    if (!user) return;

    setCreating(true);
    try {
      const group = await createGroup(trimmed, newDesc.trim(), user.id);

      // Upload image if selected
      if (imageFile && group) {
        const filePath = `groups/${group.id}/${Date.now()}_${imageFile.name}`;
        const { error: uploadError } = await supabase.storage.from('attachments').upload(filePath, imageFile);
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('attachments').getPublicUrl(filePath);
          await supabase.from('groups').update({ image_url: urlData.publicUrl } as Record<string, unknown>).eq('id', group.id);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setNewName(''); setNewDesc(''); setImageFile(null); setImagePreview(null);
      setShowCreate(false);
      toast.success('Grupo criado!');
      navigate(`/groups/${group.id}`);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Tente novamente';
      toast.error('Erro ao criar grupo: ' + msg);
    } finally {
      setCreating(false);
    }
  };

  interface GroupDisplay {
    id: string;
    name: string;
    description: string | null;
    created_at: string;
    created_by: string;
    image_url?: string | null;
    role: string;
  }

  const groups = groupMemberships
    .filter(gm => gm.groups)
    .reduce((acc, gm) => {
      const g = gm.groups as { id: string; name: string; description: string | null; created_at: string; created_by: string; image_url?: string | null };
      if (!acc.some(x => x.id === g.id)) {
        acc.push({ ...g, role: gm.role });
      }
      return acc;
    }, [] as GroupDisplay[]);

  // Fetch all group bills for the summary
  const groupIds = groups.map(g => g.id);
  const { data: allGroupBills = [] } = useQuery({
    queryKey: ['all-group-bills', groupIds],
    queryFn: async () => {
      const results = await Promise.all(groupIds.map(id => fetchGroupBills(id)));
      return results.flat();
    },
    enabled: groupIds.length > 0,
  });

  const totalPendingAll = allGroupBills.filter(b => b.status === 'pendente').reduce((s, b) => s + Number(b.amount), 0);
  const pendingCount = allGroupBills.filter(b => b.status === 'pendente').length;
  const paidCount = allGroupBills.filter(b => b.status === 'pago').length;

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="px-4 md:px-8 pt-6 pb-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold">Grupos</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie contas compartilhadas</p>
        </motion.div>

        {groups.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-4 gradient-primary rounded-2xl p-5">
            <p className="text-sm text-primary-foreground/70">Total pendente em todos os grupos</p>
            <p className="text-3xl font-display font-bold text-primary-foreground mt-1">
              {formatCurrency(totalPendingAll)}
            </p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary-foreground/50" />
                <span className="text-xs text-primary-foreground/70">{pendingCount} pendentes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                <span className="text-xs text-primary-foreground/70">{paidCount} pagas</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary-foreground/30" />
                <span className="text-xs text-primary-foreground/70">{groups.length} grupo{groups.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="px-4 md:px-8 space-y-3">
        <button onClick={() => setShowCreate(true)}
          className="w-full glass-card p-4 flex items-center justify-center gap-2 text-primary text-sm font-medium hover:bg-primary/10 transition-colors">
          <Plus size={18} /> Criar Grupo
        </button>

        {isLoading ? (
          <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : groups.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Users size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum grupo criado ainda.</p>
          </div>
        ) : (
          groups.map((group, i) => (
            <motion.button key={group.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/groups/${group.id}`)}
              className="w-full glass-card p-4 text-left hover:bg-card/90 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {group.image_url ? (
                    <img src={group.image_url} alt={group.name} className="w-12 h-12 rounded-full object-cover border-2 border-primary/10" />
                  ) : (
                    <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                      <Users size={20} className="text-primary-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm">{group.name}</p>
                    {group.description && <p className="text-xs text-muted-foreground line-clamp-1">{group.description}</p>}
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            </motion.button>
          ))
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={(v) => {
        setShowCreate(v);
        if (!v) { setNewName(''); setNewDesc(''); setImageFile(null); setImagePreview(null); }
      }}>
        <DialogContent className="bg-card border-border text-foreground max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Criar Grupo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Group image */}
            <div className="flex justify-center">
              <div className="relative">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-primary/20" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-4 border-primary/10">
                    <Users size={32} className="text-muted-foreground" />
                  </div>
                )}
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors">
                  <Camera size={14} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Nome do grupo</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value.slice(0, 100))} placeholder="Ex: Apartamento Centro"
                className="bg-secondary border-border text-foreground" maxLength={100} />
              {newName.length >= 90 && <p className="text-xs text-muted-foreground mt-1">{newName.length}/100</p>}
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Descrição (opcional)</Label>
              <Input value={newDesc} onChange={e => setNewDesc(e.target.value.slice(0, 300))} placeholder="Ex: Contas do apê"
                className="bg-secondary border-border text-foreground" maxLength={300} />
              {newDesc.length >= 280 && <p className="text-xs text-muted-foreground mt-1">{newDesc.length}/300</p>}
            </div>
            <button onClick={handleCreate} disabled={!newName.trim() || creating}
              className="w-full gradient-primary text-primary-foreground font-semibold py-3 rounded-xl disabled:opacity-50">
              {creating ? 'Criando...' : 'Criar Grupo'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupsPage;
