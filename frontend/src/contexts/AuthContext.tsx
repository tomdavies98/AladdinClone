import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

type User = { user_id: string; display_name: string } | null;

const AuthContext = createContext<{
  user: User;
  token: string | null;
  login: (userId: string, displayName: string, token: string) => void;
  logout: () => void;
  isReady: boolean;
} | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const u = localStorage.getItem('user');
    if (t && u) {
      try {
        setUser(JSON.parse(u));
        setToken(t);
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsReady(true);
  }, []);

  const login = useCallback((userId: string, displayName: string, newToken: string) => {
    setUser({ user_id: userId, display_name: displayName });
    setToken(newToken);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify({ user_id: userId, display_name: displayName }));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isReady }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
