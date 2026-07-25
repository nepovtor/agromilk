import type { ProductRecord } from "@agromilk/shared";
import { ArrowRight, Check } from "@/components/icons";
import { agromilkAsset as asset } from "@/lib/agromilkAssets";
import type { ProductCatalogActions, ProductPopover } from "./product-catalog.types";

type ProductCardProps = ProductCatalogActions & {
  product: ProductRecord;
  popover: ProductPopover;
};

export function ProductCard({
  product,
  popover,
  beginOrder,
  showProductDetails,
  toggleProductPopover,
}: ProductCardProps) {
  const compositionOpen = popover?.productId === product.id && popover.kind === "composition";
  const preparationOpen = popover?.productId === product.id && popover.kind === "preparation";
  const compositionPopoverId = `composition-${product.id}`;
  const preparationPopoverId = `preparation-${product.id}`;

  return (
    <article
      className={`agro-product-card${compositionOpen || preparationOpen ? " has-open-popover" : ""}`}
    >
      <div className="agro-product-card__top">
        <span className="agro-product-card__category">{product.category}</span>
        {product.featured && <span className="agro-product-card__featured">Популярный выбор</span>}
      </div>
      <div className="agro-product-card__body">
        <div className="agro-product-card__image">
          <img src={product.imageUrl || asset("product-scene-bag.webp")} alt={product.name} />
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
              {product.composition || "Точные показатели и состав указаны в документации к партии."}
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
}
