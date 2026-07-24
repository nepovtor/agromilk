import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { AdminUser } from "@landing/shared";
import { api } from "@/api/client";

interface AuthContextValue {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.auth.me().then((r) => setUser(r.user)).catch(() => setUser(null)).finally(() => setLoading(false)); }, []);
  useEffect(() => {
    const expire = () => setUser(null);
    window.addEventListener("admin-session-expired", expire);
    return () => window.removeEventListener("admin-session-expired", expire);
  }, []);
  const value = useMemo<AuthContextValue>(() => ({
    user, loading,
    login: async (email, password) => { const result = await api.auth.login({ email, password }); setUser(result.user); },
    logout: async () => { await api.auth.logout(); setUser(null); }
  }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
