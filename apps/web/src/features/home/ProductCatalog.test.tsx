import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProductCatalog } from "./ProductCatalog";

describe("ProductCatalog", () => {
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
