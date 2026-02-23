import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { api } from '../api/client';

type PreferencesContextValue = {
  preferences: Record<string, string>;
  refresh: () => Promise<void>;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Record<string, string>>({});

  const refresh = useCallback(async () => {
    try {
      const prefs = await api<Record<string, string>>('/design-principles/preferences');
      setPreferences(prefs ?? {});
    } catch {
      setPreferences({});
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => refresh());
  }, [refresh]);

  return (
    <PreferencesContext.Provider value={{ preferences, refresh }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
}
