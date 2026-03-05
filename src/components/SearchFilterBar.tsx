import { Search, X } from 'lucide-react';
import { BillCategory, CATEGORY_LABELS } from '@/types/finance';

interface SearchFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedCategory: string;
  onCategoryChange: (c: string) => void;
  periodFilter: string;
  onPeriodChange: (p: string) => void;
}

const categories: (BillCategory | 'todas')[] = ['todas', 'geral', 'aluguel', 'energia', 'agua', 'internet', 'mercado', 'limpeza', 'outro'];

const SearchFilterBar = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  periodFilter,
  onPeriodChange,
}: SearchFilterBarProps) => {
  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar contas..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-secondary border border-border text-foreground rounded-xl pl-9 pr-8 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {searchQuery && (
          <button onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Period filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { value: 'todos', label: 'Todos' },
          { value: 'mes', label: 'Este mês' },
          { value: 'semana', label: 'Esta semana' },
          { value: 'atrasados', label: 'Atrasados' },
        ].map((p) => (
          <button
            key={p.value}
            onClick={() => onPeriodChange(p.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              periodFilter === p.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onCategoryChange(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-primary/20 text-primary border border-primary/50'
                : 'bg-secondary text-secondary-foreground'
            }`}
          >
            {cat === 'todas' ? 'Todas' : CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SearchFilterBar;