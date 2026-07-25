import type { Dispatch, SetStateAction } from "react";
import { Link } from "wouter";
import { Menu, Phone, X } from "@/components/icons";
import { agromilkAsset as asset } from "@/lib/agromilkAssets";

type HomeHeaderProps = {
  mobileMenuOpen: boolean;
  setMobileMenuOpen: Dispatch<SetStateAction<boolean>>;
  beginOrder: () => void;
};

export function HomeHeader({ mobileMenuOpen, setMobileMenuOpen, beginOrder }: HomeHeaderProps) {
  return (
    <header className="agro-header">
      <div className="agro-container agro-header__inner">
        <a className="agro-brand" href="#top" aria-label="Агромилк — на главную">
          <img src={asset("logo-desktop.webp")} alt="Агромилк — свежесть вкуса" />
        </a>
        <nav className="agro-nav" aria-label="Основная навигация">
          <a href="#about">О компании</a>
          <a href="#catalog">Продукция</a>
          <a href="#consulting">Консалтинг</a>
          <Link href="/instructions">Инструкции</Link>
        </nav>
        <div className="agro-header__contact">
          <a href="tel:+375447442338">+375 44 744-23-38</a>
          <span>Пн–Пт, 9:00–17:00</span>
        </div>
        <button className="agro-header__cta" type="button" onClick={() => beginOrder()}>
          Получить предложение
        </button>
        <a
          className="agro-header__phone"
          href="tel:+375447442338"
          aria-label="Позвонить в Агромилк"
        >
          <Phone size={19} />
        </a>
        <button
          className="agro-menu-button"
          type="button"
          onClick={() => setMobileMenuOpen((value) => !value)}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-navigation"
          aria-label={mobileMenuOpen ? "Закрыть меню" : "Открыть меню"}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {mobileMenuOpen && (
        <div className="agro-mobile-menu" id="mobile-navigation">
          <nav aria-label="Мобильная навигация">
            <a href="#about" onClick={() => setMobileMenuOpen(false)}>
              О компании
            </a>
            <a href="#catalog" onClick={() => setMobileMenuOpen(false)}>
              Продукция
            </a>
            <a href="#consulting" onClick={() => setMobileMenuOpen(false)}>
              Консалтинг
            </a>
            <Link href="/instructions" onClick={() => setMobileMenuOpen(false)}>
              Инструкции
            </Link>
          </nav>
          <div>
            <a href="tel:+375447442338">+375 44 744-23-38</a>
            <span>Пн–Пт, 9:00–17:00</span>
          </div>
          <button className="agro-btn agro-btn--primary" type="button" onClick={() => beginOrder()}>
            Получить предложение
          </button>
        </div>
      )}
    </header>
  );
}
