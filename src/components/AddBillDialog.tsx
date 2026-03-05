import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { BillCategory, CATEGORY_LABELS, Bill } from '@/types/finance';

interface AddBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (bill: Omit<Bill, 'id' | 'createdAt'>) => void;
  isGroup?: boolean;
  members?: { user_id: string; profiles: { display_name: string | null } | null }[];
  editBill?: any; // Bill to edit
  onEdit?: (id: string, updates: any) => void;
}

const categories: BillCategory[] = ['geral', 'aluguel', 'energia', 'agua', 'internet', 'mercado', 'limpeza', 'outro'];

const AddBillDialog = ({ open, onOpenChange, onAdd, isGroup, members, editBill, onEdit }: AddBillDialogProps) => {
  const [description, setDescription] = useState(editBill?.description || '');
  const [amount, setAmount] = useState(editBill?.amount?.toString() || '');
  const [dueDate, setDueDate] = useState(editBill?.due_date || editBill?.dueDate || '');
  const [category, setCategory] = useState<BillCategory>(editBill?.category || 'geral');
  const [isRecurring, setIsRecurring] = useState(editBill?.recurrence === 'mensal');
  const [notes, setNotes] = useState(editBill?.notes || '');
  const [responsibleId, setResponsibleId] = useState(editBill?.responsible_id || editBill?.responsibleId || '');

  const isEditing = !!editBill;

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setDueDate('');
    setCategory('geral');
    setIsRecurring(false);
    setNotes('');
    setResponsibleId('');
  };

  // Reset form when dialog opens with new data
  useState(() => {
    if (editBill) {
      setDescription(editBill.description || '');
      setAmount(editBill.amount?.toString() || '');
      setDueDate(editBill.due_date || editBill.dueDate || '');
      setCategory(editBill.category || 'geral');
      setIsRecurring(editBill.recurrence === 'mensal');
      setNotes(editBill.notes || '');
      setResponsibleId(editBill.responsible_id || editBill.responsibleId || '');
    }
  });

  const handleSubmit = () => {
    if (!description || !amount) return;

    if (isEditing && onEdit) {
      onEdit(editBill.id, {
        description,
        amount: parseFloat(amount),
        due_date: dueDate || null,
        category,
        recurrence: isRecurring ? 'mensal' : 'unica',
        notes: notes || null,
        responsible_id: responsibleId || null,
      });
    } else {
      onAdd({
        description,
        amount: parseFloat(amount),
        dueDate: dueDate || undefined,
        category,
        status: 'pendente',
        recurrence: isRecurring ? 'mensal' : 'unica',
        notes,
        responsibleId: responsibleId || undefined,
      });
    }
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="bg-card border-border text-foreground max-w-sm mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">{isEditing ? 'Editar Conta' : 'Nova Conta'}</DialogTitle>
          <p className="text-sm text-muted-foreground">{isEditing ? 'Atualize os dados da conta.' : 'Adicione uma conta para acompanhar.'}</p>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Descrição</Label>
            <Input
              placeholder="Ex: Conta de luz - Janeiro"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Valor (R$)</Label>
            <Input
              type="number"
              placeholder="150.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Vencimento (opcional)</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1">
              📎 Categoria
            </Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    category === cat
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

          {isGroup && members && members.length > 0 && (
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">Responsável</Label>
              <select
                value={responsibleId}
                onChange={(e) => setResponsibleId(e.target.value)}
                className="w-full bg-secondary border border-border text-foreground rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Nenhum</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {(m.profiles as any)?.display_name || 'Membro'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Observações (opcional)</Label>
            <Textarea
              placeholder="Notas adicionais sobre esta conta..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none"
              rows={2}
            />
          </div>

          <div className="glass-card p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Conta recorrente</p>
              <p className="text-xs text-muted-foreground">Será criada automaticamente todo mês</p>
            </div>
            <Checkbox
              checked={isRecurring}
              onCheckedChange={(c) => setIsRecurring(c === true)}
              className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full gradient-primary text-primary-foreground font-semibold py-3 rounded-xl transition-all hover:opacity-90"
          >
            {isEditing ? 'Salvar Alterações' : 'Criar Conta'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddBillDialog;
