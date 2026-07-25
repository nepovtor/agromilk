import type { Dispatch, SetStateAction } from "react";
import { Link } from "wouter";
import { ArrowRight } from "@/components/icons";
import { agromilkAsset as asset } from "@/lib/agromilkAssets";

const consultingItems = [
  {
    title: "Сопровождение на всех этапах",
    text: "Консультации по зоотехнике, ветеринарии и технологии производства кормов.",
    image: asset("consulting.webp"),
    imageAlt: "Специалист осматривает животных на ферме",
    photoTitle: "Сопровождаем хозяйство от подбора продукта до результата",
  },
  {
    title: "Кормление",
    text: "Подбираем программу с учётом возраста, вида животных и задач конкретного хозяйства.",
    image: asset("consulting-feeding.webp"),
    imageAlt: "Кормление телёнка молочной смесью из бутылки",
    photoTitle: "Подбираем программу кормления под возраст молодняка",
  },
  {
    title: "Эффективность",
    text: "Помогаем повысить сохранность молодняка и прогнозируемость результатов выращивания.",
    image: asset("consulting-efficiency.webp"),
    imageAlt: "Телята получают корм в индивидуальных секциях",
    photoTitle: "Помогаем получить стабильный и измеримый результат",
  },
];

type HomeSupportProps = {
  activeConsulting: number;
  setActiveConsulting: Dispatch<SetStateAction<number>>;
  setCertificatesOpen: Dispatch<SetStateAction<boolean>>;
};

export function HomeSupport({
  activeConsulting,
  setActiveConsulting,
  setCertificatesOpen,
}: HomeSupportProps) {
  return (
    <>
      <section className="agro-consulting" id="consulting">
        <div className="agro-container">
          <div className="agro-section-heading agro-section-heading--center">
            <span className="agro-kicker">Экспертная поддержка</span>
            <h2>Консалтинг</h2>
            <p>
              Не просто поставляем продукт — помогаем встроить его в технологию вашего хозяйства.
            </p>
          </div>
          <div className="agro-consulting__panel">
            <div className="agro-accordion">
              {consultingItems.map((item, index) => (
                <button
                  className={`agro-accordion__item${activeConsulting === index ? " is-active" : ""}`}
                  type="button"
                  key={item.title}
                  onClick={() => setActiveConsulting(index)}
                  aria-expanded={activeConsulting === index}
                >
                  <span>
                    <b>0{index + 1}</b>
                    <strong>{item.title}</strong>
                  </span>
                  <ArrowRight size={20} />
                  <p>{item.text}</p>
                </button>
              ))}
            </div>
            <div className="agro-consulting__photo">
              <div className="agro-consulting__photos">
                {consultingItems.map((item, index) => (
                  <img
                    className={activeConsulting === index ? "is-active" : ""}
                    src={item.image}
                    alt={activeConsulting === index ? item.imageAlt : ""}
                    aria-hidden={activeConsulting !== index}
                    key={item.image}
                  />
                ))}
              </div>
              <div className="agro-consulting__caption" key={activeConsulting}>
                <span>Ответ специалиста</span>
                <strong>{consultingItems[activeConsulting].photoTitle}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="agro-certificates">
        <div className="agro-container agro-certificates__grid">
          <div>
            <span className="agro-kicker">Документы</span>
            <h2>Качество подтверждено международными сертификатами</h2>
            <p>
              Продукция сопровождается необходимыми документами. По запросу предоставим спецификации
              и паспорт качества конкретной партии.
            </p>
            <Link className="agro-link-button" href="/instructions">
              Открыть базу знаний <ArrowRight size={16} />
            </Link>
          </div>
          <button
            className="agro-certificates__image"
            type="button"
            onClick={() => setCertificatesOpen(true)}
            aria-label="Увеличить сертификаты"
          >
            <img src={asset("certificates.webp")} alt="Сертификаты качества Агромилк" />
          </button>
        </div>
      </section>
    </>
  );
}
