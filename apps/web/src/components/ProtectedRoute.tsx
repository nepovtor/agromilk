import type { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/context/AuthContext";
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="grid min-h-screen place-items-center text-sm text-slate-500">
        Проверка авторизации…
      </div>
    );
  if (!user) return <Redirect to="/admin/login" />;
  return children;
}
