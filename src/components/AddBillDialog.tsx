import { useState, useEffect, useCallback } from 'react';
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

// Currency formatting helpers
const formatCurrencyInput = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const cents = parseInt(digits, 10);
  const reais = cents / 100;
  return reais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const parseCurrencyToNumber = (formatted: string): number => {
  if (!formatted) return 0;
  const cleaned = formatted.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

const AddBillDialog = ({ open, onOpenChange, onAdd, isGroup, members, editBill, onEdit, onOpenAttachments }: AddBillDialogProps) => {
  const [description, setDescription] = useState('');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [category, setCategory] = useState<BillCategory>('geral');
  const [recurrence, setRecurrence] = useState<BillRecurrence>('unica');
  const [notes, setNotes] = useState('');
  const [responsibleId, setResponsibleId] = useState('');

  const isEditing = !!editBill;

  useEffect(() => {
    if (open && editBill) {
      setDescription(editBill.description || '');
      const amt = editBill.amount ? Number(editBill.amount) : 0;
      setAmountDisplay(amt > 0 ? amt.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '');
      const startVal = editBill.start_date || editBill.startDate;
      setStartDate(startVal ? new Date(startVal + 'T12:00:00') : undefined);
      const dateVal = editBill.due_date || editBill.dueDate;
      setDueDate(dateVal ? new Date(dateVal + 'T12:00:00') : undefined);
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
    setAmountDisplay('');
    setStartDate(undefined);
    setDueDate(undefined);
    setCategory('geral');
    setRecurrence('unica');
    setNotes('');
    setResponsibleId('');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setAmountDisplay(formatCurrencyInput(raw));
  };

  const handleSubmit = () => {
    const amount = parseCurrencyToNumber(amountDisplay);
    if (!description || amount <= 0) return;
    const dueDateStr = dueDate ? format(dueDate, 'yyyy-MM-dd') : undefined;
    const startDateStr = startDate ? format(startDate, 'yyyy-MM-dd') : undefined;

    if (isEditing && onEdit) {
      onEdit(editBill.id, {
        description,
        amount,
        start_date: startDateStr || null,
        due_date: dueDateStr || null,
        category,
        recurrence,
        notes: notes || null,
        responsible_id: responsibleId || null,
      });
    } else {
      onAdd({
        description,
        amount,
        startDate: startDateStr,
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

          {/* Valor com máscara monetária */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Valor</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="0,00"
                value={amountDisplay}
                onChange={handleAmountChange}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground pl-10"
              />
            </div>
          </div>

          {/* Data de Início */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Data de início (opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-secondary border-border",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy") : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[60]" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Data de Vencimento */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Data de vencimento (opcional)</Label>
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
              <PopoverContent className="w-auto p-0 z-[60]" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  initialFocus
                  className="p-3 pointer-events-auto"
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
            disabled={!description || !amountDisplay}
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
