"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authApi, clearToken, setToken, type AdminUser } from "../lib/api";

interface AuthContextValue {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null, loading: true,
  login: async () => {}, logout: () => {},
});

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi.me()
      .then(u => {
        if (u.role !== 'ADMIN') { clearToken(); setUser(null); }
        else setUser(u);
      })
      .catch(() => { clearToken(); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    if (res.user.role !== 'ADMIN') throw new Error('Not authorised as admin');
    setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AuthContext);
}
