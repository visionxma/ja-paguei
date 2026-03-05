import { useState } from 'react';
import { Plus, Users, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { fetchGroups, createGroup } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const GroupsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const { data: groupMemberships = [], isLoading } = useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: () => createGroup(newName, newDesc, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      setNewName('');
      setNewDesc('');
      setShowCreate(false);
    },
    onError: (error: any) => {
      console.error('Error creating group:', JSON.stringify(error, null, 2));
      console.error('Error details:', error?.code, error?.details, error?.hint);
      import('sonner').then(({ toast }) => toast.error('Erro ao criar grupo: ' + (error?.message || 'Tente novamente')));
    },
  });

  // Deduplicate groups by id
  const groups = groupMemberships
    .filter(gm => gm.groups)
    .reduce((acc, gm) => {
      const g = gm.groups as any;
      if (!acc.some(x => x.id === g.id)) {
        acc.push({ ...g, role: gm.role });
      }
      return acc;
    }, [] as any[]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-6 pb-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-display font-bold">Grupos</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie contas compartilhadas</p>
        </motion.div>
      </div>

      <div className="px-4 space-y-3">
        <button
          onClick={() => setShowCreate(true)}
          className="w-full glass-card p-4 flex items-center justify-center gap-2 text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
        >
          <Plus size={18} />
          Criar Grupo
        </button>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : groups.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Users size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum grupo criado ainda.</p>
          </div>
        ) : (
          groups.map((group, i) => (
            <motion.button
              key={group.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/groups/${group.id}`)}
              className="w-full glass-card p-4 text-left hover:bg-card/90 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                    <Users size={18} className="text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{group.name}</p>
                    {group.description && <p className="text-xs text-muted-foreground">{group.description}</p>}
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground" />
              </div>
            </motion.button>
          ))
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-card border-border text-foreground max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Criar Grupo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Nome do grupo</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Apartamento Centro" className="bg-secondary border-border text-foreground" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Descrição (opcional)</Label>
              <Input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Ex: Contas do apê" className="bg-secondary border-border text-foreground" />
            </div>
            <button
              onClick={() => createMutation.mutate()}
              disabled={!newName || createMutation.isPending}
              className="w-full gradient-primary text-primary-foreground font-semibold py-3 rounded-xl disabled:opacity-50"
            >
              {createMutation.isPending ? 'Criando...' : 'Criar Grupo'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupsPage;
