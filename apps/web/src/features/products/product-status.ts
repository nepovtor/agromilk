import type { ProductStatus } from "@landing/shared";

export const productStatusLabels: Record<ProductStatus, string> = {
  draft: "Черновик",
  published: "Опубликован",
  archived: "В архиве",
};

export const productStatusClasses: Record<ProductStatus, string> = {
  draft: "bg-amber-100 text-amber-800",
  published: "bg-emerald-100 text-emerald-800",
  archived: "bg-slate-100 text-slate-700",
};
