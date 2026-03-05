import { useState, useEffect, useMemo, useCallback } from 'react';
import { Users, Percent, DollarSign, Scale, Home, Divide } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

type SplitMode = 'none' | 'manual' | 'auto';
type ManualType = 'percentage' | 'value';
type AutoType = 'equal' | 'weight' | 'rooms';

export interface SplitEntry {
  user_id: string;
  percentage: number;
  amount: number;
  weight: number | null;
}

interface Member {
  user_id: string;
  profiles: { display_name: string | null } | null;
}

interface BillSplitSectionProps {
  totalAmount: number;
  members: Member[];
  splits: SplitEntry[];
  onSplitsChange: (splits: SplitEntry[]) => void;
}

const formatBRL = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getMemberName = (m: Member) =>
  (m.profiles as any)?.display_name || 'Membro';

const BillSplitSection = ({ totalAmount, members, splits, onSplitsChange }: BillSplitSectionProps) => {
  const [splitMode, setSplitMode] = useState<SplitMode>(splits.length > 0 ? 'manual' : 'none');
  const [manualType, setManualType] = useState<ManualType>('percentage');
  const [autoType, setAutoType] = useState<AutoType>('equal');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>(
    splits.length > 0 ? splits.map(s => s.user_id) : members.map(m => m.user_id)
  );

  // Local editable values
  const [percentages, setPercentages] = useState<Record<string, string>>({});
  const [values, setValues] = useState<Record<string, string>>({});
  const [weights, setWeights] = useState<Record<string, string>>({});

  // Initialize from existing splits
  useEffect(() => {
    if (splits.length > 0) {
      const pct: Record<string, string> = {};
      const val: Record<string, string> = {};
      const wt: Record<string, string> = {};
      splits.forEach(s => {
        pct[s.user_id] = s.percentage.toString();
        val[s.user_id] = formatBRL(s.amount);
        if (s.weight !== null) wt[s.user_id] = s.weight.toString();
      });
      setPercentages(pct);
      setValues(val);
      setWeights(wt);
    }
  }, []);

  const toggleMember = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const selectedMembers = useMemo(
    () => members.filter(m => selectedUserIds.includes(m.user_id)),
    [members, selectedUserIds]
  );

  // Auto-compute splits whenever inputs change
  const computeSplits = useCallback((): SplitEntry[] => {
    if (splitMode === 'none' || selectedMembers.length === 0) return [];

    if (splitMode === 'manual' && manualType === 'percentage') {
      return selectedMembers.map(m => {
        const pct = parseFloat(percentages[m.user_id] || '0') || 0;
        return { user_id: m.user_id, percentage: pct, amount: Math.round(totalAmount * pct) / 100, weight: null };
      });
    }

    if (splitMode === 'manual' && manualType === 'value') {
      return selectedMembers.map(m => {
        const cleaned = (values[m.user_id] || '0').replace(/\./g, '').replace(',', '.');
        const amt = parseFloat(cleaned) || 0;
        const pct = totalAmount > 0 ? (amt / totalAmount) * 100 : 0;
        return { user_id: m.user_id, percentage: Math.round(pct * 100) / 100, amount: amt, weight: null };
      });
    }

    if (splitMode === 'auto' && autoType === 'equal') {
      const count = selectedMembers.length;
      const each = Math.floor((totalAmount / count) * 100) / 100;
      const remainder = Math.round((totalAmount - each * count) * 100) / 100;
      return selectedMembers.map((m, i) => ({
        user_id: m.user_id,
        percentage: Math.round((100 / count) * 100) / 100,
        amount: i === 0 ? each + remainder : each,
        weight: null,
      }));
    }

    // Weight-based (both 'weight' and 'rooms')
    if (splitMode === 'auto' && (autoType === 'weight' || autoType === 'rooms')) {
      const totalWeight = selectedMembers.reduce((s, m) => s + (parseFloat(weights[m.user_id] || '1') || 1), 0);
      return selectedMembers.map(m => {
        const w = parseFloat(weights[m.user_id] || '1') || 1;
        const pct = (w / totalWeight) * 100;
        const amt = Math.round((totalAmount * w / totalWeight) * 100) / 100;
        return { user_id: m.user_id, percentage: Math.round(pct * 100) / 100, amount: amt, weight: w };
      });
    }

    return [];
  }, [splitMode, manualType, autoType, selectedMembers, totalAmount, percentages, values, weights]);

  // Push computed splits upstream
  useEffect(() => {
    const computed = computeSplits();
    onSplitsChange(computed);
  }, [splitMode, manualType, autoType, selectedUserIds, totalAmount, percentages, values, weights]);

  // Validation
  const validation = useMemo(() => {
    if (splitMode === 'none') return { valid: true, message: '' };
    const computed = computeSplits();
    if (computed.length === 0) return { valid: false, message: 'Selecione ao menos um membro.' };

    if (splitMode === 'manual' && manualType === 'percentage') {
      const total = computed.reduce((s, c) => s + c.percentage, 0);
      if (Math.abs(total - 100) > 0.01) return { valid: false, message: `Total: ${total.toFixed(1)}% — deve ser 100%` };
      if (computed.some(c => c.percentage < 0)) return { valid: false, message: 'Porcentagens não podem ser negativas.' };
    }

    if (splitMode === 'manual' && manualType === 'value') {
      const total = computed.reduce((s, c) => s + c.amount, 0);
      if (Math.abs(total - totalAmount) > 0.01) return { valid: false, message: `Total: R$ ${formatBRL(total)} — deve ser R$ ${formatBRL(totalAmount)}` };
      if (computed.some(c => c.amount < 0)) return { valid: false, message: 'Valores não podem ser negativos.' };
    }

    return { valid: true, message: '' };
  }, [splitMode, manualType, computeSplits, totalAmount]);

  if (members.length === 0) return null;

  return (
    <div className="space-y-3">
      <Label className="text-xs text-muted-foreground mb-1.5 block font-semibold uppercase tracking-wider">
        Divisão da despesa
      </Label>

      {/* Mode selector */}
      <div className="grid grid-cols-3 gap-2">
        {([
          { value: 'none', label: 'Sem divisão', icon: null },
          { value: 'manual', label: 'Manual', icon: <Percent size={14} /> },
          { value: 'auto', label: 'Automática', icon: <Divide size={14} /> },
        ] as const).map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSplitMode(opt.value)}
            className={cn(
              "p-2 rounded-xl text-center transition-all border text-xs font-medium flex flex-col items-center gap-1",
              splitMode === opt.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-secondary text-secondary-foreground hover:border-primary/50'
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>

      {splitMode !== 'none' && (
        <>
          {/* Sub-type selector */}
          {splitMode === 'manual' && (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setManualType('percentage')} className={cn("p-2 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1", manualType === 'percentage' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary text-secondary-foreground')}>
                <Percent size={12} /> Por porcentagem
              </button>
              <button type="button" onClick={() => setManualType('value')} className={cn("p-2 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1", manualType === 'value' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary text-secondary-foreground')}>
                <DollarSign size={12} /> Por valor
              </button>
            </div>
          )}

          {splitMode === 'auto' && (
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: 'equal', label: 'Igual', icon: <Users size={12} /> },
                { value: 'weight', label: 'Por peso', icon: <Scale size={12} /> },
                { value: 'rooms', label: 'Por quartos', icon: <Home size={12} /> },
              ] as const).map(opt => (
                <button key={opt.value} type="button" onClick={() => setAutoType(opt.value)} className={cn("p-2 rounded-lg text-xs font-medium border transition-all flex flex-col items-center gap-1", autoType === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary text-secondary-foreground')}>
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Member selection */}
          <div className="space-y-1">
            <p className="text-[11px] text-muted-foreground font-medium">Participantes:</p>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {members.map(m => {
                const selected = selectedUserIds.includes(m.user_id);
                const computed = computeSplits().find(s => s.user_id === m.user_id);
                return (
                  <div key={m.user_id} className={cn("flex items-center gap-2 p-2 rounded-lg border transition-all", selected ? 'border-primary/30 bg-primary/5' : 'border-border bg-secondary/50')}>
                    <Checkbox checked={selected} onCheckedChange={() => toggleMember(m.user_id)} />
                    <span className="text-xs font-medium flex-1 truncate">{getMemberName(m)}</span>

                    {selected && splitMode === 'manual' && manualType === 'percentage' && (
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={percentages[m.user_id] || ''}
                          onChange={e => setPercentages(prev => ({ ...prev, [m.user_id]: e.target.value }))}
                          className="w-16 h-7 text-xs text-center bg-background border-border"
                          placeholder="0"
                        />
                        <span className="text-[10px] text-muted-foreground">%</span>
                        {computed && <span className="text-[10px] text-muted-foreground ml-1">R$ {formatBRL(computed.amount)}</span>}
                      </div>
                    )}

                    {selected && splitMode === 'manual' && manualType === 'value' && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">R$</span>
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={values[m.user_id] || ''}
                          onChange={e => setValues(prev => ({ ...prev, [m.user_id]: e.target.value }))}
                          className="w-20 h-7 text-xs text-center bg-background border-border"
                          placeholder="0,00"
                        />
                        {computed && <span className="text-[10px] text-muted-foreground ml-1">({computed.percentage.toFixed(1)}%)</span>}
                      </div>
                    )}

                    {selected && splitMode === 'auto' && autoType === 'equal' && computed && (
                      <span className="text-[10px] text-muted-foreground">R$ {formatBRL(computed.amount)}</span>
                    )}

                    {selected && splitMode === 'auto' && (autoType === 'weight' || autoType === 'rooms') && (
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground">Peso:</span>
                        <Input
                          type="number"
                          min="1"
                          step="1"
                          value={weights[m.user_id] || '1'}
                          onChange={e => setWeights(prev => ({ ...prev, [m.user_id]: e.target.value }))}
                          className="w-14 h-7 text-xs text-center bg-background border-border"
                        />
                        {computed && <span className="text-[10px] text-muted-foreground ml-1">R$ {formatBRL(computed.amount)}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          {selectedMembers.length > 0 && (
            <div className={cn("p-2.5 rounded-lg text-xs border", validation.valid ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400' : 'border-destructive/30 bg-destructive/5 text-destructive')}>
              {validation.valid
                ? `✓ Divisão válida — ${selectedMembers.length} participante(s)`
                : `✗ ${validation.message}`
              }
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BillSplitSection;
