import { createContext, useContext, ReactNode } from 'react';
import { usePreferences } from '@/hooks/usePreferences';

interface FormatContextType {
  currency: string;
  dateFormat: string;
  formatCurrency: (value: number) => string;
  formatDate: (date?: string | null) => string;
}

const FormatContext = createContext<FormatContextType>({
  currency: 'BRL',
  dateFormat: 'DD/MM/YYYY',
  formatCurrency: (v) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  formatDate: (d) => d ? new Date(d).toLocaleDateString('pt-BR') : '',
});

export const useFormat = () => useContext(FormatContext);

const currencyLocaleMap: Record<string, { locale: string; currency: string }> = {
  BRL: { locale: 'pt-BR', currency: 'BRL' },
  USD: { locale: 'en-US', currency: 'USD' },
  EUR: { locale: 'de-DE', currency: 'EUR' },
};

export const FormatProvider = ({ children }: { children: ReactNode }) => {
  const { preferences } = usePreferences();
  const curr = preferences?.currency || 'BRL';
  const dateFmt = preferences?.date_format || 'DD/MM/YYYY';

  const formatCurrency = (value: number): string => {
    const cfg = currencyLocaleMap[curr] || currencyLocaleMap.BRL;
    return Number(value).toLocaleString(cfg.locale, { style: 'currency', currency: cfg.currency });
  };

  const formatDate = (date?: string | null): string => {
    if (!date) return '';
    const d = new Date(date.length === 10 ? date + 'T12:00:00' : date);
    if (isNaN(d.getTime())) return '';
    if (dateFmt === 'MM/DD/YYYY') {
      return d.toLocaleDateString('en-US');
    }
    return d.toLocaleDateString('pt-BR');
  };

  return (
    <FormatContext.Provider value={{ currency: curr, dateFormat: dateFmt, formatCurrency, formatDate }}>
      {children}
    </FormatContext.Provider>
  );
};
