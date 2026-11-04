import React, { createContext, useContext, useState, useEffect } from 'react';
import { InternshipPeriod } from '../types/database';
import { dataService } from '../services/dataService';

interface PeriodContextType {
  periods: InternshipPeriod[];
  activePeriod: InternshipPeriod | null;
  selectedPeriodId: string;
  setSelectedPeriodId: (id: string) => void;
  refreshPeriods: () => Promise<void>;
  isLoading: boolean;
}

const PeriodContext = createContext<PeriodContextType | undefined>(undefined);

export const PeriodProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [periods, setPeriods] = useState<InternshipPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodIdState] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const loadPeriods = async () => {
    try {
      setIsLoading(true);
      const list = await dataService.getPeriods();
      setPeriods(list);

      // Default to active period or first period
      const active = list.find(p => p.is_active) || list[0];
      if (active && !selectedPeriodId) {
        setSelectedPeriodIdState(active.id);
      }
    } catch (err) {
      console.error('Failed to load periods:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPeriods();
  }, []);

  const setSelectedPeriodId = (id: string) => {
    setSelectedPeriodIdState(id);
  };

  const activePeriod = periods.find(p => p.id === selectedPeriodId) || null;

  return (
    <PeriodContext.Provider
      value={{
        periods,
        activePeriod,
        selectedPeriodId,
        setSelectedPeriodId,
        refreshPeriods: loadPeriods,
        isLoading,
      }}
    >
      {children}
    </PeriodContext.Provider>
  );
};

export const usePeriod = () => {
  const context = useContext(PeriodContext);
  if (!context) throw new Error('usePeriod must be used within PeriodProvider');
  return context;
};
