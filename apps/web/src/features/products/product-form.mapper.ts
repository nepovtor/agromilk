import type { ProductInput, ProductRecord, ProductStatus } from "@landing/shared";

export type ProductFormValues = {
  name: string;
  slug: string;
  category: string;
  description: string;
  usesText: string;
  composition: string;
  preparation: string;
  imageUrl: string;
  status: ProductStatus;
  sortOrder: number;
  featured: boolean;
};

export const emptyProductForm: ProductFormValues = {
  name: "",
  slug: "",
  category: "Для телят",
  description: "",
  usesText: "",
  composition: "",
  preparation: "",
  imageUrl: "/assets/agromilk/product-scene-bag.png",
  status: "draft",
  sortOrder: 100,
  featured: false,
};

export function productToForm(product: ProductRecord): ProductFormValues {
  return {
    name: product.name,
    slug: product.slug,
    category: product.category,
    description: product.description,
    usesText: product.uses.join("\n"),
    composition: product.composition,
    preparation: product.preparation,
    imageUrl: product.imageUrl || "",
    status: product.status,
    sortOrder: product.sortOrder,
    featured: product.featured,
  };
}

export function formToProductInput(form: ProductFormValues, slug: string): ProductInput {
  return {
    name: form.name,
    slug,
    category: form.category,
    description: form.description,
    uses: form.usesText
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean),
    composition: form.composition,
    preparation: form.preparation,
    imageUrl: form.imageUrl,
    status: form.status,
    sortOrder: Number(form.sortOrder) || 0,
    featured: form.featured,
  };
}
