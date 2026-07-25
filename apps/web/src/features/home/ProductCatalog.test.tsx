import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ProductRecord } from "@agromilk/shared";
import { ProductCatalog } from "./ProductCatalog";

describe("ProductCatalog", () => {
  const product: ProductRecord = {
    id: "product-1",
    name: "Агромилк",
    slug: "agromilk",
    category: "Для телят",
    description: "Полноценное питание",
    uses: ["Телятам", "Ягнятам", "Козлятам", "Не отображается"],
    composition: "Белок 20%",
    preparation: "Развести водой",
    imageUrl: null,
    status: "published",
    sortOrder: 1,
    featured: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };

  it("renders products, filters, popovers, details and ordering actions", () => {
    const beginOrder = vi.fn();
    const showProductDetails = vi.fn();
    const setCatalogCategory = vi.fn();
    const setCatalogSearch = vi.fn();
    const toggleProductPopover = vi.fn();
    const { rerender } = render(
      <ProductCatalog
        categories={["Все", "Для телят"]}
        catalogCategory="Все"
        catalogSearch=""
        loading={false}
        error=""
        productPopover={null}
        visibleProducts={[product]}
        beginOrder={beginOrder}
        retry={vi.fn()}
        setCatalogCategory={setCatalogCategory}
        setCatalogSearch={setCatalogSearch}
        showProductDetails={showProductDetails}
        toggleProductPopover={toggleProductPopover}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Для телят" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Поиск по каталогу" }), {
      target: { value: "молоко" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Заказать" }));
    fireEvent.click(screen.getByRole("button", { name: /Состав/ }));
    fireEvent.click(screen.getByRole("button", { name: /Показать способ/ }));
    expect(setCatalogCategory).toHaveBeenCalledWith("Для телят");
    expect(setCatalogSearch).toHaveBeenCalledWith("молоко");
    expect(beginOrder).toHaveBeenCalledWith(product);
    expect(toggleProductPopover).toHaveBeenCalledWith(product.id, "composition");
    expect(toggleProductPopover).toHaveBeenCalledWith(product.id, "preparation");

    rerender(
      <ProductCatalog
        categories={["Все", "Для телят"]}
        catalogCategory="Для телят"
        catalogSearch="молоко"
        loading={false}
        error=""
        productPopover={{ productId: product.id, kind: "composition" }}
        visibleProducts={[product]}
        beginOrder={beginOrder}
        retry={vi.fn()}
        setCatalogCategory={setCatalogCategory}
        setCatalogSearch={setCatalogSearch}
        showProductDetails={showProductDetails}
        toggleProductPopover={toggleProductPopover}
      />,
    );
    expect(
      screen.getByRole("region", { name: `Состав продукта ${product.name}` }),
    ).toHaveTextContent("Белок 20%");
    fireEvent.click(screen.getByRole("button", { name: /Все сведения/ }));
    expect(showProductDetails).toHaveBeenCalledWith(product);
  });

  it("shows the API error instead of a fallback product list", () => {
    const retry = vi.fn();
    render(
      <ProductCatalog
        categories={["Все"]}
        catalogCategory="Все"
        catalogSearch=""
        loading={false}
        error="Каталог временно недоступен"
        productPopover={null}
        visibleProducts={[]}
        beginOrder={vi.fn()}
        retry={retry}
        setCatalogCategory={vi.fn()}
        setCatalogSearch={vi.fn()}
        showProductDetails={vi.fn()}
        toggleProductPopover={vi.fn()}
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Каталог временно недоступен");
    expect(screen.queryByText("Ничего не найдено")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Попробовать снова" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
