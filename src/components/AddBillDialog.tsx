import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { BillCategory, CATEGORY_LABELS, Bill } from '@/types/finance';

interface AddBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (bill: Omit<Bill, 'id' | 'createdAt'>) => void;
}

const categories: BillCategory[] = ['geral', 'aluguel', 'energia', 'agua', 'internet', 'mercado', 'limpeza', 'outro'];

const AddBillDialog = ({ open, onOpenChange, onAdd }: AddBillDialogProps) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState<BillCategory>('geral');
  const [isRecurring, setIsRecurring] = useState(false);

  const handleSubmit = () => {
    if (!description || !amount) return;
    onAdd({
      description,
      amount: parseFloat(amount),
      dueDate: dueDate || undefined,
      category,
      status: 'pendente',
      recurrence: isRecurring ? 'mensal' : 'unica',
    });
    setDescription('');
    setAmount('');
    setDueDate('');
    setCategory('geral');
    setIsRecurring(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border text-foreground max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-lg">Nova Conta</DialogTitle>
          <p className="text-sm text-muted-foreground">Adicione uma conta para acompanhar.</p>
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
              <span>📎</span> Categoria
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
            Criar Conta
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddBillDialog;
