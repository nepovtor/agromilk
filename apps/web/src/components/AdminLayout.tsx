import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { BarChart3, BookOpen, Boxes, Inbox, LogOut, Menu, Sparkles, X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Обзор", icon: BarChart3 },
  { href: "/admin/applications", label: "Заявки", icon: Inbox },
  { href: "/admin/products", label: "Продукция", icon: Boxes },
  { href: "/admin/articles", label: "Инструкции", icon: BookOpen },
];
export function AdminLayout({ children }: { children: ReactNode }) {
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const sidebar = (
    <aside className="flex h-full w-64 flex-col border-r border-(--border) bg-white p-4">
      <div className="mb-7 flex items-start justify-between px-2">
        <Link href="/admin" className="group">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-(--primary) text-white shadow-sm">
            <Sparkles size={20} />
          </span>
          <span className="mt-3 block text-xl font-bold leading-tight">Агро-пульт</span>
          <span className="mt-1 block text-xs font-medium text-slate-500">Agromilk admin</span>
        </Link>
        <button className="md:hidden" onClick={() => setOpen(false)}>
          <X size={20} />
        </button>
      </div>
      <nav className="space-y-1">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? location === href : location.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                active
                  ? "bg-(--secondary) text-(--secondary-foreground) shadow-sm"
                  : "text-slate-600 hover:bg-(--muted)",
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-(--border) pt-4">
        <div className="mb-3 px-3">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="truncate text-xs text-slate-500">{user?.email}</p>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={async () => {
            await logout();
            navigate("/admin/login");
          }}
        >
          <LogOut size={17} />
          Выйти
        </Button>
      </div>
    </aside>
  );
  return (
    <div className="agro-admin min-h-screen">
      <div className="fixed inset-y-0 left-0 hidden md:block">{sidebar}</div>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={() => setOpen(false)}>
          <div className="h-full w-64" onClick={(e) => e.stopPropagation()}>
            {sidebar}
          </div>
        </div>
      )}
      <div className="md:pl-64">
        <header className="flex h-16 items-center border-b border-(--border) bg-white/90 px-4 backdrop-blur md:px-8">
          <button className="mr-3 md:hidden" onClick={() => setOpen(true)}>
            <Menu />
          </button>
          <span className="text-sm font-medium text-slate-600">
            Управление заявками, продукцией, инструкциями и аналитикой
          </span>
        </header>
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
