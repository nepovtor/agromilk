import { Link } from "wouter";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Clock3,
  MessageCircle,
  ShieldCheck,
} from "@/components/icons";
import { agromilkAsset as asset } from "@/lib/agromilkAssets";

const benefits = [
  {
    value: "1 000 м²",
    title: "производства",
    text: "Собственное высокотехнологичное производство.",
  },
  { value: "от 25 кг", title: "доставка", text: "Доставляем по регионам и комплектуем документы." },
  {
    value: "40 000 т",
    title: "отгружено",
    text: "За 16 лет работы отгрузили нашим клиентам более 40 000 тонн продукции.",
  },
  {
    value: "16 лет",
    title: "на рынке",
    text: "Производим высокотехнологичный продукт ЗЦМ и ЗОМ «Агромилк».",
  },
];

export function HomeIntro({ beginOrder }: { beginOrder: () => void }) {
  return (
    <>
      <section className="agro-hero">
        <div className="agro-hero__shape" aria-hidden="true" />
        <div className="agro-container agro-hero__grid">
          <div className="agro-hero__content">
            <span className="agro-eyebrow">
              <BadgeCheck size={18} /> Собственное производство в Беларуси
            </span>
            <h1>Современные заменители цельного и обезжиренного молока</h1>
            <strong className="agro-hero__mobile-name">АГРОМИЛК</strong>
            <p>
              ЗЦМ и ЗОМ «Агромилк» для телят, поросят, ягнят и козлят. Стабильный состав, удобное
              приготовление и технологическое сопровождение хозяйства.
            </p>
            <div className="agro-hero__actions">
              <button
                className="agro-btn agro-btn--primary"
                type="button"
                onClick={() => beginOrder()}
              >
                Сделать заказ <ArrowRight size={18} />
              </button>
              <Link className="agro-btn agro-btn--secondary" href="/instructions">
                Инструкции
              </Link>
            </div>
            <div className="agro-hero__trust">
              <span>
                <ShieldCheck size={20} /> Паспорта качества
              </span>
              <span>
                <Clock3 size={20} /> Быстрая отгрузка
              </span>
              <span>
                <MessageCircle size={20} /> Консультация специалиста
              </span>
            </div>
          </div>
          <div className="agro-hero__visual">
            <div className="agro-hero__badge">
              <strong>Бесплатная доставка</strong>
              <span>по Минску от 100 кг</span>
            </div>
            <picture>
              <source media="(max-width: 580px)" srcSet={asset("hero-animals-mobile.webp")} />
              <img
                className="agro-hero__animals"
                src={asset("hero-animals-desktop.webp")}
                alt="Теленок и продукция Агромилк"
              />
            </picture>
            <div className="agro-hero__discount">
              <span>−10%</span>
              <p>при самовывозе со склада</p>
            </div>
          </div>
        </div>
      </section>

      <section className="agro-about" id="about">
        <div className="agro-container">
          <div className="agro-section-heading agro-section-heading--split">
            <div>
              <span className="agro-kicker">О компании</span>
              <h2>Надёжный продукт для хозяйств любого масштаба</h2>
            </div>
            <p>
              ООО «Свежесть вкуса» производит сухие молочные продукты и сопровождает клиентов от
              подбора продукта до внедрения схемы кормления.
            </p>
          </div>
          <div className="agro-about__grid">
            <article className="agro-about__story">
              <div className="agro-about__mobile-title">
                <span>О компании</span>
                <strong>ООО «Свежесть вкуса»</strong>
              </div>
              <h3>Контроль качества на каждом этапе</h3>
              <ul>
                <li>
                  <Check size={18} /> Высокотехнологичное производство
                </li>
                <li>
                  <Check size={18} /> Производим ЗЦМ и ЗОМ «Агромилк» более 16 лет
                </li>
                <li>
                  <Check size={18} /> Продаём сухие молочные и сывороточные продукты для разных сфер
                  применения
                </li>
                <li>
                  <Check size={18} /> Сотрудничаем с надёжными, проверенными поставщиками
                </li>
                <li>
                  <Check size={18} /> Работаем в Республике Беларусь и странах СНГ
                </li>
              </ul>
            </article>
            <div className="agro-stats">
              {benefits.map((item, index) => (
                <article className="agro-stat" key={item.value}>
                  <span className="agro-stat__number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <strong>{item.value}</strong>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
