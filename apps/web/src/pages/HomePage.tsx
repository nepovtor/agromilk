import { zodResolver } from "@hookform/resolvers/zod";
import {
  createApplicationSchema,
  type CreateApplicationInput,
  type ProductRecord,
} from "@landing/shared";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "wouter";
import { api } from "@/api/client";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Clock3,
  Menu,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  X,
} from "@/components/icons";

const asset = (name: string) => `/assets/agromilk/${name}`;

const fallbackProducts: ProductRecord[] = [
  {
    id: "fallback-1",
    name: "ЗОМ «Агромилк»",
    slug: "zom-agromilk",
    category: "Для поросят и КРС",
    description:
      "Сухой молочный порошок с высоким содержанием протеина и витаминно-минеральным комплексом для плавного перехода молодняка на сухой рацион.",
    uses: ["Выпаивание и выкармливание поросят", "Добавление в сухой корм поросятам и КРС"],
    composition:
      "Молочная сыворотка, источники белка и энергии, витаминно-минеральный комплекс. Точные показатели указаны в паспорте качества партии.",
    preparation:
      "Разводить чистой водой согласно инструкции к партии. Использовать свежеприготовленную смесь.",
    imageUrl: asset("product-scene-bag.png"),
    status: "published",
    sortOrder: 10,
    featured: true,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "fallback-2",
    name: "ЗЦМ «Агромилк-2» 16%",
    slug: "zcm-agromilk-2-16",
    category: "Для телят",
    description:
      "Быстрорастворимый заменитель цельного молока с выраженным молочно-ванильным ароматом для ручного и автоматического выпаивания.",
    uses: [
      "Со 2-й недели жизни",
      "Для автоматических кормовых станций",
      "Для добавления в сухой корм КРС",
    ],
    composition: "Молочные компоненты, источники белка и жира, витаминно-минеральный комплекс.",
    preparation:
      "Порошок постепенно вносить в воду 45–50 °C. Перед выпаиванием довести смесь до 38–40 °C.",
    imageUrl: asset("product-scene-bag.png"),
    status: "published",
    sortOrder: 20,
    featured: true,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "fallback-3",
    name: "ЗЦМ «Агромилк-3» 11%",
    slug: "zcm-agromilk-3-11",
    category: "Для телят",
    description:
      "Однородная молочная смесь для стабильного роста молодняка и постепенного перехода на основной рацион.",
    uses: ["С 3-й недели жизни", "Добавление в сухой корм КРС"],
    composition: "Молочная основа, растительные белки, жиры, витамины и микроэлементы.",
    preparation: "Смешивать с водой 45–50 °C до однородности. Выпаивать при температуре 38–40 °C.",
    imageUrl: asset("product-scene-bag.png"),
    status: "published",
    sortOrder: 30,
    featured: false,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "fallback-4",
    name: "ЗЦМ «Агромилк-4» 16%",
    slug: "zcm-agromilk-4-16",
    category: "Для поросят",
    description:
      "Питательная смесь для выпаивания поросят и применения в комбикормах с хорошей растворимостью и поедаемостью.",
    uses: ["Выпаивание поросят", "Замена молока свиноматки", "Добавление в сухой корм"],
    composition: "Молочные и растительные компоненты, источники энергии, витамины и минералы.",
    preparation:
      "Готовить непосредственно перед кормлением и соблюдать дозировку из инструкции к партии.",
    imageUrl: asset("product-scene-bag.png"),
    status: "published",
    sortOrder: 40,
    featured: false,
    createdAt: "",
    updatedAt: "",
  },
  {
    id: "fallback-5",
    name: "ЗЦМ «Агромилк-5» 12%",
    slug: "zcm-agromilk-5-12",
    category: "Для телят",
    description:
      "Экономичный заменитель молока для поздних этапов выращивания телят и плавного перехода к основному рациону.",
    uses: ["С 5-й недели жизни", "Добавление в сухой корм КРС"],
    composition: "Молочные и растительные компоненты, витаминно-минеральный комплекс.",
    preparation:
      "Растворять при интенсивном перемешивании. Не хранить готовую смесь длительное время.",
    imageUrl: asset("product-scene-bag.png"),
    status: "published",
    sortOrder: 50,
    featured: false,
    createdAt: "",
    updatedAt: "",
  },
];

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

const consultingItems = [
  {
    title: "Сопровождение на всех этапах",
    text: "Консультации по зоотехнике, ветеринарии и технологии производства кормов.",
    image: asset("consulting.png"),
    imageAlt: "Специалист осматривает животных на ферме",
    photoTitle: "Сопровождаем хозяйство от подбора продукта до результата",
  },
  {
    title: "Кормление",
    text: "Подбираем программу с учётом возраста, вида животных и задач конкретного хозяйства.",
    image: asset("consulting-feeding.jpg"),
    imageAlt: "Кормление телёнка молочной смесью из бутылки",
    photoTitle: "Подбираем программу кормления под возраст молодняка",
  },
  {
    title: "Эффективность",
    text: "Помогаем повысить сохранность молодняка и прогнозируемость результатов выращивания.",
    image: asset("consulting-efficiency.jpg"),
    imageAlt: "Телята получают корм в индивидуальных секциях",
    photoTitle: "Помогаем получить стабильный и измеримый результат",
  },
];

const initialValues = {
  name: "",
  phone: "",
  email: "",
  message: "",
  consent: true as const,
  website: "",
};
type ProductPopover = { productId: string; kind: "composition" | "preparation" } | null;

export function HomePage() {
  const [products, setProducts] = useState<ProductRecord[]>(fallbackProducts);
  const [activeConsulting, setActiveConsulting] = useState(0);
  const [detailProduct, setDetailProduct] = useState<ProductRecord | null>(null);
  const [productPopover, setProductPopover] = useState<ProductPopover>(null);
  const [certificatesOpen, setCertificatesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("Все");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateApplicationInput>({
    resolver: zodResolver(createApplicationSchema),
    defaultValues: initialValues,
  });

  useEffect(() => {
    api.products
      .publicList()
      .then((response) => {
        setProducts(response.items);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!detailProduct && !certificatesOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDetailProduct(null);
        setCertificatesOpen(false);
      }
    };
    document.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", close);
      document.body.style.overflow = "";
    };
  }, [certificatesOpen, detailProduct]);

  useEffect(() => {
    if (!productPopover) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Element && !target.closest("[data-product-popover-root]"))
        setProductPopover(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProductPopover(null);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [productPopover]);

  const sortedProducts = useMemo(
    () => products.slice().sort((a, b) => a.sortOrder - b.sortOrder),
    [products],
  );
  const categories = useMemo(
    () => ["Все", ...new Set(sortedProducts.map((product) => product.category))],
    [sortedProducts],
  );
  const visibleProducts = useMemo(() => {
    const term = catalogSearch.trim().toLocaleLowerCase("ru");
    return sortedProducts.filter((product) => {
      const matchesCategory = catalogCategory === "Все" || product.category === catalogCategory;
      const matchesSearch =
        !term ||
        [product.name, product.category, product.description, ...product.uses].some((value) =>
          value.toLocaleLowerCase("ru").includes(term),
        );
      return matchesCategory && matchesSearch;
    });
  }, [catalogCategory, catalogSearch, sortedProducts]);

  const beginOrder = (product?: ProductRecord, message?: string) => {
    setDetailProduct(null);
    setProductPopover(null);
    setMobileMenuOpen(false);
    setServerError("");
    setSuccess(false);
    if (product) {
      setSelectedProductId(product.id);
      setValue("message", `Интересует продукт: ${product.name}.`);
    } else if (message) {
      setValue("message", message);
    }
    window.requestAnimationFrame(() =>
      document.getElementById("order")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  const toggleProductPopover = (productId: string, kind: NonNullable<ProductPopover>["kind"]) => {
    setProductPopover((current) =>
      current?.productId === productId && current.kind === kind ? null : { productId, kind },
    );
  };

  const showProductDetails = (product: ProductRecord) => {
    setProductPopover(null);
    setDetailProduct(product);
  };

  const submit = handleSubmit(async (values) => {
    setServerError("");
    try {
      const query = new URLSearchParams(window.location.search);
      await api.applications.create({
        ...values,
        sourcePage: window.location.href,
        utmSource: query.get("utm_source") || undefined,
        utmMedium: query.get("utm_medium") || undefined,
        utmCampaign: query.get("utm_campaign") || undefined,
      });
      setSuccess(true);
      setSelectedProductId("");
      reset(initialValues);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Не удалось отправить заявку");
    }
  });

  return (
    <div className="agromilk-site" data-app-shell="agromilk">
      <header className="agro-header">
        <div className="agro-container agro-header__inner">
          <a className="agro-brand" href="#top" aria-label="Агромилк — на главную">
            <img src={asset("logo-desktop.png")} alt="Агромилк — свежесть вкуса" />
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
            <button
              className="agro-btn agro-btn--primary"
              type="button"
              onClick={() => beginOrder()}
            >
              Получить предложение
            </button>
          </div>
        )}
      </header>

      <main id="top">
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
                <source media="(max-width: 580px)" srcSet={asset("hero-animals-mobile.png")} />
                <img
                  className="agro-hero__animals"
                  src={asset("hero-animals-desktop.png")}
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
                    <Check size={18} /> Продаём сухие молочные и сывороточные продукты для разных
                    сфер применения
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

        <section className="agro-catalog" id="catalog">
          <div className="agro-container">
            <div className="agro-section-heading agro-section-heading--split">
              <div>
                <span className="agro-kicker">Каталог</span>
                <h2>Подберите продукт под возраст и задачи хозяйства</h2>
              </div>
              <p>
                Технические характеристики, состав и схема приготовления доступны в подробном
                просмотре каждой позиции.
              </p>
            </div>
            <article className="agro-delivery-banner">
              <div className="agro-delivery-banner__copy">
                <span>Расчёт для хозяйства</span>
                <h3>Подберём продукт и рассчитаем ваш заказ</h3>
                <p>Учтём вид и возраст животных, нужный объём и регион доставки.</p>
                <ul className="agro-delivery-banner__terms" aria-label="Условия заказа">
                  <li>
                    <Check size={15} /> Минимальная партия — <strong>25 кг</strong>
                  </li>
                  <li>
                    <Check size={15} /> При самовывозе — <strong>скидка 10%</strong>
                  </li>
                </ul>
              </div>
              <div className="agro-delivery-banner__art">
                <img src={asset("product-scene-base.png")} alt="Корова" />
                <img src={asset("product-scene-bag.png")} alt="Упаковка продукции Агромилк" />
                <img src={asset("product-scene-cow.png")} alt="Ягнёнок" />
              </div>
              <div className="agro-delivery-banner__action">
                <button
                  className="agro-btn agro-btn--light"
                  type="button"
                  onClick={() =>
                    beginOrder(
                      undefined,
                      "Хочу подобрать продукт и рассчитать объём заказа и доставку.",
                    )
                  }
                >
                  Получить расчёт <ArrowRight size={18} />
                </button>
                <span>Ответим Пн–Пт, 9:00–17:00</span>
              </div>
            </article>
            <div className="agro-catalog-tools">
              <label className="agro-catalog-search">
                <Search size={18} />
                <span className="sr-only">Поиск по каталогу</span>
                <input
                  value={catalogSearch}
                  onChange={(event) => setCatalogSearch(event.target.value)}
                  placeholder="Найти продукт или применение"
                />
                {catalogSearch && (
                  <button
                    type="button"
                    onClick={() => setCatalogSearch("")}
                    aria-label="Очистить поиск"
                  >
                    <X size={17} />
                  </button>
                )}
              </label>
              <div className="agro-category-filter" aria-label="Категории продуктов">
                {categories.map((category) => (
                  <button
                    className={catalogCategory === category ? "is-active" : ""}
                    type="button"
                    key={category}
                    onClick={() => setCatalogCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
              <span className="agro-catalog-count">Найдено: {visibleProducts.length}</span>
            </div>
            <div className="agro-product-grid">
              {visibleProducts.map((product) => {
                const compositionOpen =
                  productPopover?.productId === product.id && productPopover.kind === "composition";
                const preparationOpen =
                  productPopover?.productId === product.id && productPopover.kind === "preparation";
                const compositionPopoverId = `composition-${product.id}`;
                const preparationPopoverId = `preparation-${product.id}`;
                return (
                  <article
                    className={`agro-product-card${compositionOpen || preparationOpen ? " has-open-popover" : ""}`}
                    key={product.id}
                  >
                    <div className="agro-product-card__top">
                      <span className="agro-product-card__category">{product.category}</span>
                      {product.featured && (
                        <span className="agro-product-card__featured">Популярный выбор</span>
                      )}
                    </div>
                    <div className="agro-product-card__body">
                      <div className="agro-product-card__image">
                        <img
                          src={product.imageUrl || asset("product-scene-bag.png")}
                          alt={product.name}
                        />
                      </div>
                      <div>
                        <h3>{product.name}</h3>
                        <p>{product.description}</p>
                      </div>
                    </div>
                    <ul className="agro-product-card__uses">
                      {product.uses.slice(0, 3).map((use) => (
                        <li key={use}>
                          <Check size={16} />
                          {use}
                        </li>
                      ))}
                    </ul>
                    <div
                      className="agro-product-popover-root agro-product-card__composition"
                      data-product-popover-root
                    >
                      <button
                        className="agro-product-card__composition-trigger"
                        type="button"
                        onClick={() => toggleProductPopover(product.id, "composition")}
                        aria-expanded={compositionOpen}
                        aria-controls={compositionPopoverId}
                      >
                        Состав <ArrowRight size={15} />
                      </button>
                      {compositionOpen && (
                        <aside
                          className="agro-product-flyout agro-product-flyout--composition"
                          id={compositionPopoverId}
                          role="region"
                          aria-label={`Состав продукта ${product.name}`}
                        >
                          <strong>Состав и показатели</strong>
                          <p>
                            {product.composition ||
                              "Точные показатели и состав указаны в документации к партии."}
                          </p>
                          <button type="button" onClick={() => showProductDetails(product)}>
                            Все сведения о продукте <ArrowRight size={14} />
                          </button>
                        </aside>
                      )}
                    </div>
                    <div className="agro-product-card__actions">
                      <div className="agro-product-popover-root" data-product-popover-root>
                        <button
                          className="agro-product-card__help"
                          type="button"
                          onClick={() => toggleProductPopover(product.id, "preparation")}
                          aria-expanded={preparationOpen}
                          aria-controls={preparationPopoverId}
                          aria-label={`Показать способ использования продукта ${product.name}`}
                        >
                          ?
                        </button>
                        {preparationOpen && (
                          <aside
                            className="agro-product-flyout agro-product-flyout--preparation"
                            id={preparationPopoverId}
                            role="region"
                            aria-label={`Способ использования продукта ${product.name}`}
                          >
                            <strong>Способ использования</strong>
                            <p>
                              {product.preparation ||
                                "Используйте рекомендации, указанные в инструкции к продукту."}
                            </p>
                            <button type="button" onClick={() => showProductDetails(product)}>
                              Открыть полную инструкцию <ArrowRight size={14} />
                            </button>
                          </aside>
                        )}
                      </div>
                      <button
                        className="agro-btn agro-btn--primary agro-btn--small"
                        type="button"
                        onClick={() => beginOrder(product)}
                      >
                        Заказать
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            {visibleProducts.length === 0 && (
              <div className="agro-catalog-empty">
                <Search size={28} />
                <strong>Ничего не найдено</strong>
                <p>Измените запрос или выберите другую категорию.</p>
                <button
                  type="button"
                  onClick={() => {
                    setCatalogSearch("");
                    setCatalogCategory("Все");
                  }}
                >
                  Сбросить фильтры
                </button>
              </div>
            )}
          </div>
        </section>

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
                Продукция сопровождается необходимыми документами. По запросу предоставим
                спецификации и паспорт качества конкретной партии.
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
              <img src={asset("certificates.png")} alt="Сертификаты качества Агромилк" />
            </button>
          </div>
        </section>

        <section className="agro-order" id="order">
          <div className="agro-container agro-order__grid">
            <div className="agro-order__copy">
              <span className="agro-kicker">Заказ и доставка</span>
              <h2>Получите расчёт поставки под ваше хозяйство</h2>
              <p>
                Оставьте контакты. Специалист уточнит вид животных, возраст, необходимый объём и
                предложит подходящий продукт.
              </p>
              <div className="agro-order__conditions">
                <span>
                  <strong>от 25 кг</strong> доставка по регионам
                </span>
                <span>
                  <strong>от 100 кг</strong> бесплатно по Минску
                </span>
                <span>
                  <strong>−10%</strong> при самовывозе
                </span>
              </div>
            </div>
            <form className="agro-order__form" onSubmit={submit} noValidate>
              <div>
                <h3>Заполните ваши данные</h3>
                <p>Перезвоним в рабочее время и ответим на вопросы.</p>
              </div>
              <label>
                Ваше имя
                <input {...register("name")} autoComplete="name" placeholder="Ваше имя" />
                {errors.name && <small>{errors.name.message}</small>}
              </label>
              <label>
                Телефон
                <input
                  {...register("phone")}
                  autoComplete="tel"
                  inputMode="tel"
                  placeholder="Ваш телефон"
                />
                {errors.phone && <small>{errors.phone.message}</small>}
              </label>
              <label className="agro-order__optional">
                Email <span>(необязательно)</span>
                <input
                  {...register("email")}
                  autoComplete="email"
                  inputMode="email"
                  placeholder="name@company.by"
                />
                {errors.email && <small>{errors.email.message}</small>}
              </label>
              <label className="agro-order__optional">
                Интересующий продукт <span>(необязательно)</span>
                <select
                  value={selectedProductId}
                  onChange={(event) => {
                    const productId = event.target.value;
                    setSelectedProductId(productId);
                    const product = sortedProducts.find((item) => item.id === productId);
                    if (product) setValue("message", `Интересует продукт: ${product.name}.`);
                  }}
                >
                  <option value="">Нужна помощь с выбором</option>
                  {sortedProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="agro-order__optional">
                Комментарий
                <textarea
                  {...register("message")}
                  rows={3}
                  placeholder="Укажите вид животных, возраст и примерный объём"
                />
              </label>
              <input
                className="agro-honeypot"
                tabIndex={-1}
                autoComplete="off"
                {...register("website")}
              />
              <label className="agro-checkbox agro-order__optional">
                <input type="checkbox" defaultChecked {...register("consent")} />
                <span>
                  Я согласен на обработку персональных данных и принимаю{" "}
                  <Link href="/privacy">политику конфиденциальности</Link>.
                </span>
              </label>
              {serverError && (
                <p className="agro-form-message is-error" role="alert">
                  {serverError}
                </p>
              )}
              {success && (
                <p className="agro-form-message is-success" role="status">
                  Заявка принята. Мы свяжемся с вами в ближайшее рабочее время.
                </p>
              )}
              <button
                className="agro-btn agro-btn--primary agro-btn--full"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Отправляем…" : "Заказать"}
                <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="agro-footer">
        <div className="agro-container agro-footer__grid">
          <div>
            <img src={asset("logo-desktop.png")} alt="Агромилк" />
            <p>Современные заменители цельного и обезжиренного молока.</p>
          </div>
          <section>
            <h2>Контакты</h2>
            <a href="tel:+375447442338">+375 44 744-23-38</a>
            <a href="tel:+375172703278">+375 17 270-32-78</a>
            <a href="mailto:fresh.vks@mail.ru">fresh.vks@mail.ru</a>
          </section>
          <section>
            <h2>Адрес</h2>
            <address>
              ООО «Свежесть вкуса»
              <br />
              г. Минск, Республика Беларусь
            </address>
          </section>
          <section>
            <h2>Время работы</h2>
            <span>Пн–Пт: 9:00–17:00</span>
            <span>Выходной: суббота, воскресенье</span>
          </section>
        </div>
        <div className="agro-container agro-footer__bottom">
          <span>© {new Date().getFullYear()} ООО «Свежесть вкуса»</span>
          <span>Информация на сайте не является публичной офертой.</span>
        </div>
      </footer>

      {detailProduct && (
        <div
          className="agro-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDetailProduct(null);
          }}
        >
          <div
            className="agro-modal__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
          >
            <button
              className="agro-modal__close"
              type="button"
              onClick={() => setDetailProduct(null)}
              aria-label="Закрыть"
            >
              <X size={22} />
            </button>
            <div className="agro-modal__hero">
              <div>
                <span>{detailProduct.category}</span>
                <h2 id="product-modal-title">{detailProduct.name}</h2>
                <p>{detailProduct.description}</p>
              </div>
              <img
                src={detailProduct.imageUrl || asset("product-scene-bag.png")}
                alt={detailProduct.name}
              />
            </div>
            <div className="agro-modal__columns">
              <section>
                <h3>Применение</h3>
                <ul>
                  {detailProduct.uses.map((use) => (
                    <li key={use}>
                      <Check size={16} />
                      {use}
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h3>Состав</h3>
                <p>
                  {detailProduct.composition ||
                    "Точные показатели и состав указаны в документации к партии."}
                </p>
              </section>
              <section>
                <h3>Приготовление</h3>
                <p>
                  {detailProduct.preparation ||
                    "Используйте рекомендации, указанные в инструкции к продукту."}
                </p>
              </section>
            </div>
            <div className="agro-modal__footer">
              <p>Точную дозировку и документы предоставим при расчёте заказа.</p>
              <button
                className="agro-btn agro-btn--primary"
                type="button"
                onClick={() => beginOrder(detailProduct)}
              >
                Запросить расчёт <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
      {certificatesOpen && (
        <div
          className="agro-modal agro-certificate-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCertificatesOpen(false);
          }}
        >
          <div
            className="agro-certificate-modal__panel"
            role="dialog"
            aria-modal="true"
            aria-label="Сертификаты качества"
          >
            <button
              className="agro-modal__close"
              type="button"
              onClick={() => setCertificatesOpen(false)}
              aria-label="Закрыть"
            >
              <X size={22} />
            </button>
            <img
              src={asset("certificates.png")}
              alt="Сертификаты качества Агромилк в увеличенном виде"
            />
          </div>
        </div>
      )}
    </div>
  );
}
