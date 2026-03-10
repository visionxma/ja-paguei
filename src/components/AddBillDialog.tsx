import { useState, useEffect, useRef, useMemo } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Paperclip, Upload, Camera, X, FileText, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { BillCategory, BillRecurrence, CATEGORY_LABELS, Bill } from '@/types/finance';
import BillSplitSection, { SplitEntry } from '@/components/BillSplitSection';

interface AddBillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (bill: Omit<Bill, 'id' | 'createdAt'>, splits?: SplitEntry[], pendingFiles?: File[]) => void;
  isGroup?: boolean;
  members?: { user_id: string; profiles: { display_name: string | null } | null }[];
  editBill?: any;
  onEdit?: (id: string, updates: any, splits?: SplitEntry[]) => void;
  onOpenAttachments?: (billId: string) => void;
  existingSplits?: SplitEntry[];
}

const categories: BillCategory[] = ['geral', 'aluguel', 'energia', 'agua', 'internet', 'mercado', 'limpeza', 'outro'];
const recurrenceOptions: { value: BillRecurrence; label: string; desc: string }[] = [
  { value: 'unica', label: 'Única', desc: 'Pagamento único' },
  { value: 'mensal', label: 'Mensal', desc: 'Todo mês' },
  { value: 'anual', label: 'Anual', desc: 'Uma vez por ano' },
];

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

const AddBillDialog = ({ open, onOpenChange, onAdd, isGroup, members, editBill, onEdit, onOpenAttachments, existingSplits }: AddBillDialogProps) => {
  const [description, setDescription] = useState('');
  const [amountDisplay, setAmountDisplay] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [category, setCategory] = useState<BillCategory>('geral');
  const [recurrence, setRecurrence] = useState<BillRecurrence>('unica');
  const [notes, setNotes] = useState('');
  const [responsibleId, setResponsibleId] = useState('');
  const [splits, setSplits] = useState<SplitEntry[]>(existingSplits || []);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
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
    if (open && existingSplits) setSplits(existingSplits);
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
    setSplits([]);
    setPendingFiles([]);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setAmountDisplay(formatCurrencyInput(raw));
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const validFiles: File[] = [];
      for (const file of Array.from(files)) {
        if (file.size > MAX_FILE_SIZE) {
          import('sonner').then(({ toast }) => toast.error(`"${file.name}" excede o limite de 10MB.`));
          continue;
        }
        if (!ALLOWED_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
          import('sonner').then(({ toast }) => toast.error(`"${file.name}" — tipo de arquivo não suportado.`));
          continue;
        }
        validFiles.push(file);
      }
      if (validFiles.length > 0) {
        setPendingFiles(prev => [...prev, ...validFiles]);
      }
    }
    e.target.value = '';
  };

  const removePendingFile = (index: number) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <ImageIcon size={14} className="text-primary shrink-0" />;
    return <FileText size={14} className="text-primary shrink-0" />;
  };

  // Memoize object URLs to prevent memory leaks
  const filePreviewUrls = useMemo(() => {
    return pendingFiles.map(file => {
      if (file.type.startsWith('image/')) {
        return URL.createObjectURL(file);
      }
      return null;
    });
  }, [pendingFiles]);

  // Cleanup object URLs on unmount or when files change
  useEffect(() => {
    return () => {
      filePreviewUrls.forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [filePreviewUrls]);

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const handleSubmit = () => {
    const errors: string[] = [];
    const trimmedDesc = description.trim();
    if (!trimmedDesc) errors.push('Nome da conta é obrigatório');
    if (trimmedDesc.length > 200) errors.push('Nome da conta deve ter no máximo 200 caracteres');
    
    const amount = parseCurrencyToNumber(amountDisplay);
    if (amount <= 0) errors.push('Valor deve ser maior que zero');
    if (amount > 999999999) errors.push('Valor excede o limite permitido');
    
    if (notes && notes.length > 1000) errors.push('Descrição deve ter no máximo 1000 caracteres');
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);
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
      }, splits);
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
      }, splits, pendingFiles.length > 0 ? pendingFiles : undefined);
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

        {/* Validation errors */}
          {validationErrors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 space-y-1">
              {validationErrors.map((err, i) => (
                <p key={i} className="text-xs text-destructive flex items-center gap-1.5">
                  <AlertCircle size={12} className="shrink-0" /> {err}
                </p>
              ))}
            </div>
          )}

        <div className="space-y-4 mt-2">
          {/* Nome da conta */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Nome da conta</Label>
            <Input
              placeholder="Ex: Conta de luz - Janeiro"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Valor */}
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

          {/* Data de Vencimento */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Data de vencimento (opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal bg-secondary border-border", !dueDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "dd/MM/yyyy") : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[60]" align="start">
                <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          {/* Descrição */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Descrição (opcional)</Label>
            <Textarea
              placeholder="Notas adicionais sobre esta conta..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none"
              rows={3}
            />
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

          {/* Data de Início */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block">Data de início (opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal bg-secondary border-border", !startDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd/MM/yyyy") : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[60]" align="start">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>

          {/* Responsável + Divisão (grupo) */}
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

          {isGroup && members && members.length > 0 && (
            <BillSplitSection
              totalAmount={parseCurrencyToNumber(amountDisplay)}
              members={members}
              splits={splits}
              onSplitsChange={setSplits}
            />
          )}

          {/* Anexos */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
              <Paperclip size={12} /> Anexos
            </Label>

            {/* Upload buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 glass-card p-2.5 flex items-center justify-center gap-2 text-primary text-xs font-medium hover:bg-primary/10 transition-colors"
              >
                <Upload size={14} /> Arquivo
              </button>
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 glass-card p-2.5 flex items-center justify-center gap-2 text-primary text-xs font-medium hover:bg-primary/10 transition-colors"
              >
                <Camera size={14} /> Câmera
              </button>
              {isEditing && onOpenAttachments && (
                <button
                  type="button"
                  onClick={() => onOpenAttachments(editBill.id)}
                  className="flex-1 glass-card p-2.5 flex items-center justify-center gap-2 text-primary text-xs font-medium hover:bg-primary/10 transition-colors"
                >
                  <Paperclip size={14} /> Ver todos
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Pending files preview */}
            {pendingFiles.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {pendingFiles.map((file, i) => {
                  const preview = filePreviewUrls[i];
                  return (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 border border-border/50">
                      {preview ? (
                        <img src={preview} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center shrink-0">
                          {getFileIcon(file)}
                        </div>
                      )}
                      <span className="text-xs text-foreground truncate flex-1">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removePendingFile(i)}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
                <p className="text-[10px] text-muted-foreground">
                  {pendingFiles.length} arquivo(s) será(ão) enviado(s) ao criar a conta.
                </p>
              </div>
            )}
          </div>

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
