import type { ProductRecord } from "@agromilk/shared";

export type ProductPopover = { productId: string; kind: "composition" | "preparation" } | null;

export type ProductCatalogActions = {
  beginOrder: (product?: ProductRecord, message?: string) => void;
  showProductDetails: (product: ProductRecord) => void;
  toggleProductPopover: (productId: string, kind: NonNullable<ProductPopover>["kind"]) => void;
};
