import type { ProductRecord } from "@agromilk/shared";
import { ProductCard } from "./ProductCard";
import type { ProductCatalogActions, ProductPopover } from "./product-catalog.types";

type ProductGridProps = ProductCatalogActions & {
  products: ProductRecord[];
  popover: ProductPopover;
};

export function ProductGrid({ products, popover, ...actions }: ProductGridProps) {
  return (
    <div className="agro-product-grid">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} popover={popover} {...actions} />
      ))}
    </div>
  );
}
