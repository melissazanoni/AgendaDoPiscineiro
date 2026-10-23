import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setUnauthorizedHandler, tokenStorage } from '../api/client';
import { authApi } from '../api/endpoints';
import type { User } from '../api/types';

type AuthState = {
  user: User | null;
  loading: boolean; // true enquanto confere se o token salvo ainda vale
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => Boolean(tokenStorage.get()));

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  // Se a API responder 401 (token expirado), sai do sistema
  useEffect(() => setUnauthorizedHandler(logout), [logout]);

  // Ao abrir o site, confere se o token salvo ainda é válido
  useEffect(() => {
    if (!tokenStorage.get()) return;
    authApi
      .me()
      .then(setUser)
      .catch(logout)
      .finally(() => setLoading(false));
  }, [logout]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      logout,
      login: async (email, password) => {
        const { user: u, token } = await authApi.login(email, password);
        tokenStorage.set(token);
        setUser(u);
      },
      register: async (name, email, password) => {
        const { user: u, token } = await authApi.register(name, email, password);
        tokenStorage.set(token);
        setUser(u);
      },
    }),
    [user, loading, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}
