import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@agromilk/shared";
import { Redirect, useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/api";

const googleErrors: Record<string, string> = {
  cancelled: "Вход через Google был отменён.",
  invalid_state: "Сессия входа устарела. Попробуйте ещё раз.",
  email_not_verified: "Google-аккаунт не подтвердил email.",
  access_denied: "У этого Google-аккаунта нет доступа к админ-панели.",
  provider_error: "Google временно не смог выполнить вход. Попробуйте ещё раз.",
  not_configured: "Вход через Google не настроен.",
};

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.8 3-4.3 3-7.3Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1a5.8 5.8 0 0 1-5.5-4H3.2v2.6A10 10 0 0 0 12 22Z"
      />
      <path fill="#FBBC05" d="M6.5 14a6 6 0 0 1 0-4V7.4H3.2a10 10 0 0 0 0 9.2L6.5 14Z" />
      <path
        fill="#EA4335"
        d="M12 5.9c1.5 0 2.9.5 4 1.5l3-3A10 10 0 0 0 3.2 7.4L6.5 10A5.8 5.8 0 0 1 12 6Z"
      />
    </svg>
  );
}

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const [, navigate] = useLocation();
  const [error, setError] = useState(() => {
    if (typeof window === "undefined") return "";
    const code = new URLSearchParams(window.location.search).get("google_error");
    return code ? googleErrors[code] || "Не удалось войти через Google." : "";
  });
  const [googleEnabled, setGoogleEnabled] = useState(false);
  useEffect(() => {
    api.auth
      .googleStatus()
      .then(({ enabled }) => setGoogleEnabled(enabled))
      .catch(() => setGoogleEnabled(false));
  }, []);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const submit = handleSubmit(async (values) => {
    setError("");
    try {
      await login(values.email, values.password);
      navigate("/admin");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Ошибка входа");
    }
  });
  if (!loading && user) return <Redirect to="/admin" />;
  return (
    <div className="agro-admin grid min-h-screen place-items-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-(--primary) text-lg font-bold text-white">
            Ag
          </div>
          <CardTitle className="text-2xl">Вход в агро-пульт</CardTitle>
          <CardDescription>
            Доступ к заявкам хозяйств, материалам и статистике сайта.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {googleEnabled && (
            <>
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full gap-3"
                onClick={() => {
                  window.location.assign("/api/v1/auth/google");
                }}
              >
                <GoogleLogo />
                Войти через Google
              </Button>
              <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-slate-400">
                <span className="h-px flex-1 bg-slate-200" />
                <span>или</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
            </>
          )}
          <form className="space-y-5" onSubmit={(event) => void submit(event)}>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Email</span>
              <Input type="email" autoComplete="username" {...register("email")} />
              {errors.email && <span className="text-xs text-red-600">{errors.email.message}</span>}
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">Пароль</span>
              <Input type="password" autoComplete="current-password" {...register("password")} />
              {errors.password && (
                <span className="text-xs text-red-600">{errors.password.message}</span>
              )}
            </label>
            {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            <Button className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "Вход…" : "Войти"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
