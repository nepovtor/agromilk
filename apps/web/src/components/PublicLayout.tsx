import { Link } from "wouter";
import type { ReactNode } from "react";
import {
  KnowledgeFooter,
  KnowledgeHeader,
  type KnowledgeLayoutVariant,
} from "@/components/public/KnowledgeChrome";
import { agromilkAsset } from "@/lib/agromilkAssets";

type PublicLayoutProps = {
  children: ReactNode;
  variant?: "default" | KnowledgeLayoutVariant;
};

export function PublicLayout({
  children,
  variant = "default",
}: PublicLayoutProps) {
  if (variant !== "default") {
    return <KnowledgeLayout variant={variant}>{children}</KnowledgeLayout>;
  }

  return (
    <div className="agromilk-public min-h-screen">
      <header className="agro-public-header">
        <div className="agro-container agro-public-header__inner">
          <Link
            href="/"
            className="agro-public-logo"
            aria-label="Агромилк — на главную"
          >
            <img src={agromilkAsset("logo-desktop.png")} alt="Агромилк" />
          </Link>
          <nav className="agro-public-nav" aria-label="Основная навигация">
            <Link href="/">Главная</Link>
            <Link href="/instructions">Инструкции</Link>
            <a href="/#catalog">Продукция</a>
            <a href="/#order">Сделать заказ</a>
          </nav>
        </div>
      </header>
      <main className="agro-public-page">{children}</main>
      <footer className="agro-public-footer">
        <div className="agro-container agro-public-footer__inner">
          <Link href="/">
            <img src={agromilkAsset("logo-desktop.png")} alt="Агромилк" />
          </Link>
          <nav>
            <Link href="/instructions">Инструкции</Link>
            <Link href="/privacy">Конфиденциальность</Link>
            <a href="mailto:fresh.vks@mail.ru">fresh.vks@mail.ru</a>
          </nav>
          <span>© {new Date().getFullYear()} ООО «Свежесть вкуса»</span>
        </div>
      </footer>
    </div>
  );
}

function KnowledgeLayout({
  children,
  variant,
}: {
  children: ReactNode;
  variant: KnowledgeLayoutVariant;
}) {
  const pageClass =
    variant === "article"
      ? "agro-article-layout-page"
      : "agro-instructions-page";

  return (
    <div className={`agromilk-public agromilk-public--${variant} min-h-screen`}>
      <KnowledgeHeader variant={variant} />
      <main className={`agro-public-page ${pageClass}`}>{children}</main>
      <KnowledgeFooter variant={variant} />
    </div>
  );
}
