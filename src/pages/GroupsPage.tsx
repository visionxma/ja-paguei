import { useState } from 'react';
import { Plus, Users, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { mockGroups } from '@/data/mockData';
import { Group } from '@/types/finance';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const GroupsPage = () => {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>(mockGroups);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const createGroup = () => {
    if (!newName) return;
    const g: Group = {
      id: `g${Date.now()}`,
      name: newName,
      description: newDesc,
      createdAt: new Date().toISOString().slice(0, 10),
      members: [{ id: '1', name: 'Você', email: 'you@mail.com', role: 'admin' }],
      bills: [],
    };
    setGroups(prev => [g, ...prev]);
    setNewName('');
    setNewDesc('');
    setShowCreate(false);
  };

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

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

        {groups.map((group, i) => {
          const totalPending = group.bills.filter(b => b.status === 'pendente').reduce((s, b) => s + b.amount, 0);
          return (
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
                    <p className="text-xs text-muted-foreground">{group.members.length} membros</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {totalPending > 0 && (
                    <span className="text-xs font-medium text-warning bg-warning/15 px-2 py-0.5 rounded-full">
                      {formatCurrency(totalPending)}
                    </span>
                  )}
                  <ChevronRight size={16} className="text-muted-foreground" />
                </div>
              </div>
            </motion.button>
          );
        })}

        {groups.length === 0 && (
          <div className="glass-card p-8 text-center">
            <Users size={32} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Nenhum grupo criado ainda.</p>
          </div>
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
            <button onClick={createGroup} className="w-full gradient-primary text-primary-foreground font-semibold py-3 rounded-xl">
              Criar Grupo
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupsPage;
