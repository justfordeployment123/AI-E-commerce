"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authApi, type User } from "../lib/api";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null, token: null, loading: true,
  login: async () => {}, loginWithToken: async () => {}, register: async () => {}, logout: () => {},
  refreshUser: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("ts_token");
    if (stored) {
      setToken(stored);
      authApi.me()
        .then(setUser)
        .catch(() => { localStorage.removeItem("ts_token"); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const persist = useCallback((u: User, t: string) => {
    localStorage.setItem("ts_token", t);
    setToken(t);
    setUser(u);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    persist(res.user, res.token);
  }, [persist]);

  const loginWithToken = useCallback(async (token: string) => {
    localStorage.setItem("ts_token", token);
    setToken(token);
    const user = await authApi.me();
    setUser(user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await authApi.register(name, email, password);
    persist(res.user, res.token);
  }, [persist]);

  const logout = useCallback(() => {
    localStorage.removeItem("ts_token");
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const fresh = await authApi.me();
    setUser(fresh);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, loginWithToken, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
