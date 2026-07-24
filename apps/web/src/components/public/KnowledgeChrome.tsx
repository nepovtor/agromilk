import { Link } from "wouter";
import { agromilkAsset } from "@/lib/agromilkAssets";

export type KnowledgeLayoutVariant = "instructions" | "article";

const footerContent = {
  contacts: {
    phone: "+375 44 744 23 38",
    office: "+375 17 270 32 78",
    fax: "80172707726 - факс",
    email: "fresh.vks@mail.ru",
  },
  address: (
    <>
      ООО «Свежесть Вкуса»
      <br />
      220049 г. Минск, ул.
      <br />
      Волгоградская, д.13, к.
      <br />
      213-99
    </>
  ),
  hours: {
    weekdays: "Пн-Пт 9.00 - 17.00",
    weekend: "Выходной: Суббота, Воскресенье",
  },
};

export function KnowledgeHeader({
  variant,
}: {
  variant: KnowledgeLayoutVariant;
}) {
  const prefix =
    variant === "article" ? "agro-article-layout" : "agro-instructions";
  const containerClass =
    variant === "article"
      ? `${prefix}-header__inner`
      : `agro-instructions-container ${prefix}-header__inner`;

  return (
    <header className={`${prefix}-header`}>
      <div className={containerClass}>
        <Link
          href="/"
          className={`${prefix}-header__logo`}
          aria-label="Агромилк — на главную"
        >
          <img
            src={agromilkAsset("logo-desktop.png")}
            alt="Агромилк — Свежесть вкуса"
          />
        </Link>
        <div className={`${prefix}-header__contacts`}>
          <a className={`${prefix}-header__phone`} href="tel:+375447442338">
            <img src={agromilkAsset("phone.svg")} alt="" />
            <span>+375 44 744-23-38</span>
          </a>
          <div className={`${prefix}-header__secondary`}>
            <span>+375 17 270-32-78 — факс</span>
            <span aria-hidden="true"> / </span>
            <a href="mailto:fresh.vks@mail.ru">fresh.vks@mail.ru</a>
          </div>
        </div>
      </div>
    </header>
  );
}

export function KnowledgeFooter({
  variant,
}: {
  variant: KnowledgeLayoutVariant;
}) {
  const isArticle = variant === "article";
  const prefix = isArticle ? "agro-article-layout" : "agro-instructions";
  const innerClass = isArticle
    ? `${prefix}-footer__inner`
    : `agro-instructions-container ${prefix}-footer__grid`;
  const sectionClass = (name: string) =>
    isArticle ? `${prefix}-footer__${name}` : undefined;

  return (
    <footer className={`${prefix}-footer`}>
      <div className={innerClass}>
        <section className={sectionClass("contacts")}>
          <h2>Контакты</h2>
          <div className={`${prefix}-footer__copy`}>
            <a href="tel:+375447442338">{footerContent.contacts.phone}</a>
            <span>{footerContent.contacts.office}</span>
            <span>{footerContent.contacts.fax}</span>
            <a href={`mailto:${footerContent.contacts.email}`}>
              {footerContent.contacts.email}
            </a>
            <Link className={`${prefix}-footer__privacy`} href="/privacy">
              Политика конфиденциальности
            </Link>
          </div>
        </section>
        <section className={sectionClass("address")}>
          <h2>Адрес</h2>
          <address className={`${prefix}-footer__copy`}>
            {footerContent.address}
          </address>
        </section>
        <section className={sectionClass("hours")}>
          <h2>Время работы</h2>
          <div className={`${prefix}-footer__copy`}>
            <span>{footerContent.hours.weekdays}</span>
            <span>{footerContent.hours.weekend}</span>
          </div>
        </section>
      </div>
    </footer>
  );
}
