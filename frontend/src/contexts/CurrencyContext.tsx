import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { CurrencyType } from '../utils/currency';

interface CurrencyContextType {
  currency: CurrencyType;
  setCurrency: (currency: CurrencyType) => void;
  toggleCurrency: () => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyType>('IDR');

  useEffect(() => {
    // Check user's preference from localStorage
    const savedCurrency = localStorage.getItem('currency') as CurrencyType | null;
    
    if (savedCurrency && ['IDR', 'USD'].includes(savedCurrency)) {
      setCurrency(savedCurrency);
    }
  }, []);

  useEffect(() => {
    // Save preference to localStorage
    localStorage.setItem('currency', currency);
  }, [currency]);

  const toggleCurrency = () => {
    setCurrency(prev => prev === 'IDR' ? 'USD' : 'IDR');
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, toggleCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}