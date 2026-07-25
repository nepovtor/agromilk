import type { Dispatch, SetStateAction } from "react";
import type { ProductRecord } from "@agromilk/shared";
import { ArrowRight, Check } from "@/components/icons";
import { agromilkAsset as asset } from "@/lib/agromilkAssets";
import { ProductCatalogFilters } from "./ProductCatalogFilters";
import { ProductCatalogStates } from "./ProductCatalogStates";
import { ProductGrid } from "./ProductGrid";
import type { ProductPopover } from "./product-catalog.types";

export type { ProductPopover } from "./product-catalog.types";

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
  const resetFilters = () => {
    setCatalogSearch("");
    setCatalogCategory("Все");
  };

  return (
    <section className="agro-catalog" id="catalog">
      <div className="agro-container">
        <div className="agro-section-heading agro-section-heading--split">
          <div>
            <span className="agro-kicker">Каталог</span>
            <h2>Подберите продукт под возраст и задачи хозяйства</h2>
          </div>
          <p>
            Технические характеристики, состав и схема приготовления доступны в подробном просмотре
            каждой позиции.
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
        <ProductCatalogFilters
          categories={categories}
          category={catalogCategory}
          search={catalogSearch}
          count={visibleProducts.length}
          setCategory={setCatalogCategory}
          setSearch={setCatalogSearch}
        />
        {!loading && !error && visibleProducts.length > 0 && (
          <ProductGrid
            products={visibleProducts}
            popover={productPopover}
            beginOrder={beginOrder}
            showProductDetails={showProductDetails}
            toggleProductPopover={toggleProductPopover}
          />
        )}
        <ProductCatalogStates
          loading={loading}
          error={error}
          empty={visibleProducts.length === 0}
          retry={retry}
          reset={resetFilters}
        />
      </div>
    </section>
  );
}
