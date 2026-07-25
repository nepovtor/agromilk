import type { Dispatch, SetStateAction } from "react";
import type { ProductRecord } from "@agromilk/shared";
import { ArrowRight, Check, Search, X } from "@/components/icons";
import { agromilkAsset as asset } from "@/lib/agromilkAssets";

export type ProductPopover = { productId: string; kind: "composition" | "preparation" } | null;

type ProductCatalogProps = {
  categories: string[];
  catalogCategory: string;
  catalogSearch: string;
  loading: boolean;
  error: string;
  productPopover: ProductPopover;
  visibleProducts: ProductRecord[];
  beginOrder: (product?: ProductRecord, message?: string) => void;
  retry: () => void;
  setCatalogCategory: Dispatch<SetStateAction<string>>;
  setCatalogSearch: Dispatch<SetStateAction<string>>;
  showProductDetails: (product: ProductRecord) => void;
  toggleProductPopover: (productId: string, kind: NonNullable<ProductPopover>["kind"]) => void;
};

export function ProductCatalog({
  categories,
  catalogCategory,
  catalogSearch,
  loading,
  error,
  productPopover,
  visibleProducts,
  beginOrder,
  retry,
  setCatalogCategory,
  setCatalogSearch,
  showProductDetails,
  toggleProductPopover,
}: ProductCatalogProps) {
  return (
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
                <img src={asset("product-scene-base.webp")} alt="Корова" />
                <img src={asset("product-scene-bag.webp")} alt="Упаковка продукции Агромилк" />
                <img src={asset("product-scene-cow.webp")} alt="Ягнёнок" />
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
            {loading && (
              <div className="agro-catalog-empty" role="status">
                <strong>Загружаем каталог…</strong>
              </div>
            )}
            {error && !loading && (
              <div className="agro-catalog-empty" role="alert">
                <strong>Не удалось загрузить каталог</strong>
                <p>{error}</p>
                <button type="button" onClick={retry}>
                  Попробовать снова
                </button>
              </div>
            )}
            {!loading && !error && (
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
                          src={product.imageUrl || asset("product-scene-bag.webp")}
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
            )}
            {!loading && !error && visibleProducts.length === 0 && (
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

  );
}
