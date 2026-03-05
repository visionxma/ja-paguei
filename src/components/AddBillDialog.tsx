import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Paperclip } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { BillCategory, BillRecurrence, CATEGORY_LABELS, Bill } from '@/types/finance';

interface AddBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (bill: Omit<Bill, 'id' | 'createdAt'>) => void;
  isGroup?: boolean;
  members?: { user_id: string; profiles: { display_name: string | null } | null }[];
  editBill?: any;
  onEdit?: (id: string, updates: any) => void;
  onOpenAttachments?: (billId: string) => void;
}

const categories: BillCategory[] = ['geral', 'aluguel', 'energia', 'agua', 'internet', 'mercado', 'limpeza', 'outro'];
const recurrenceOptions: { value: BillRecurrence; label: string; desc: string }[] = [
  { value: 'unica', label: 'Única', desc: 'Pagamento único' },
  { value: 'mensal', label: 'Mensal', desc: 'Todo mês' },
  { value: 'anual', label: 'Anual', desc: 'Uma vez por ano' },
];

const AddBillDialog = ({ open, onOpenChange, onAdd, isGroup, members, editBill, onEdit, onOpenAttachments }: AddBillDialogProps) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [category, setCategory] = useState<BillCategory>('geral');
  const [recurrence, setRecurrence] = useState<BillRecurrence>('unica');
  const [notes, setNotes] = useState('');
  const [responsibleId, setResponsibleId] = useState('');

  const isEditing = !!editBill;

  useEffect(() => {
    if (open && editBill) {
      setDescription(editBill.description || '');
      setAmount(editBill.amount?.toString() || '');
      const dateVal = editBill.due_date || editBill.dueDate;
      setDueDate(dateVal ? new Date(dateVal) : undefined);
      setCategory(editBill.category || 'geral');
      setRecurrence(editBill.recurrence || 'unica');
      setNotes(editBill.notes || '');
      setResponsibleId(editBill.responsible_id || editBill.responsibleId || '');
    } else if (open && !editBill) {
      resetForm();
    }
  }, [open, editBill]);

  const resetForm = () => {
    setDescription('');
    setAmount('');
    setDueDate(undefined);
    setCategory('geral');
    setRecurrence('unica');
    setNotes('');
    setResponsibleId('');
  };

  const handleSubmit = () => {
    if (!description || !amount) return;
    const dueDateStr = dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined;

    if (isEditing && onEdit) {
      onEdit(editBill.id, {
        description,
        amount: parseFloat(amount),
        due_date: dueDateStr || null,
        category,
        recurrence,
        notes: notes || null,
        responsible_id: responsibleId || null,
      });
    } else {
      onAdd({
        description,
        amount: parseFloat(amount),
        dueDate: dueDateStr,
        category,
        status: 'pendente',
        recurrence,
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
          {/* Descrição */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Descrição</Label>
            <Input
              placeholder="Ex: Conta de luz - Janeiro"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Valor */}
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

          {/* Data de Vencimento com Calendar Popover */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Vencimento (opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-secondary border-border",
                    !dueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "dd/MM/yyyy") : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Categoria */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Categoria</Label>
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

          {/* Recorrência */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Tipo de conta</Label>
            <div className="grid grid-cols-3 gap-2">
              {recurrenceOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setRecurrence(opt.value)}
                  className={`p-2.5 rounded-xl text-center transition-all border ${
                    recurrence === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-secondary text-secondary-foreground hover:border-primary/50'
                  }`}
                >
                  <p className="text-xs font-semibold">{opt.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Responsável (apenas em grupo) */}
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

          {/* Observações */}
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

          {/* Anexos (somente ao editar) */}
          {isEditing && onOpenAttachments && (
            <button
              onClick={() => { onOpenAttachments(editBill.id); }}
              className="w-full glass-card p-3 flex items-center justify-center gap-2 text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
            >
              <Paperclip size={16} />
              Gerenciar Anexos
            </button>
          )}

          <button
            onClick={handleSubmit}
            disabled={!description || !amount}
            className="w-full gradient-primary text-primary-foreground font-semibold py-3 rounded-xl transition-all hover:opacity-90 disabled:opacity-50"
          >
            {isEditing ? 'Salvar Alterações' : 'Criar Conta'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddBillDialog;
