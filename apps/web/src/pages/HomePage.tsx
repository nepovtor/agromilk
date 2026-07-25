import type { ProductRecord } from "@agromilk/shared";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/api";
import { HomeFooter } from "@/features/home/HomeFooter";
import { HomeHeader } from "@/features/home/HomeHeader";
import { HomeIntro } from "@/features/home/HomeIntro";
import { HomeModals } from "@/features/home/HomeModals";
import { HomeSupport } from "@/features/home/HomeSupport";
import { OrderSection, type OrderRequest } from "@/features/home/OrderSection";
import { ProductCatalog, type ProductPopover } from "@/features/home/ProductCatalog";

export function HomePage() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [activeConsulting, setActiveConsulting] = useState(0);
  const [detailProduct, setDetailProduct] = useState<ProductRecord | null>(null);
  const [productPopover, setProductPopover] = useState<ProductPopover>(null);
  const [certificatesOpen, setCertificatesOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("Все");
  const [orderRequest, setOrderRequest] = useState<OrderRequest>(null);

  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError("");
    try {
      const response = await api.products.publicList();
      setProducts(response.items);
    } catch (error) {
      setProducts([]);
      setProductsError(
        error instanceof Error ? error.message : "Не удалось загрузить каталог продукции",
      );
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(loadProducts);
  }, [loadProducts]);

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
    setOrderRequest({
      key: crypto.randomUUID(),
      productId: product?.id,
      message,
    });
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

  return (
    <div className="agromilk-site" data-app-shell="agromilk">
      <HomeHeader
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        beginOrder={beginOrder}
      />
      <main id="top">
        <HomeIntro beginOrder={beginOrder} />
        <ProductCatalog
          categories={categories}
          catalogCategory={catalogCategory}
          catalogSearch={catalogSearch}
          loading={productsLoading}
          error={productsError}
          productPopover={productPopover}
          visibleProducts={visibleProducts}
          beginOrder={beginOrder}
          retry={() => void loadProducts()}
          setCatalogCategory={setCatalogCategory}
          setCatalogSearch={setCatalogSearch}
          showProductDetails={showProductDetails}
          toggleProductPopover={toggleProductPopover}
        />
        <HomeSupport
          activeConsulting={activeConsulting}
          setActiveConsulting={setActiveConsulting}
          setCertificatesOpen={setCertificatesOpen}
        />
        <OrderSection
          key={orderRequest?.key ?? "initial-order-form"}
          products={sortedProducts}
          request={orderRequest}
        />
      </main>
      <HomeFooter />
      <HomeModals
        certificatesOpen={certificatesOpen}
        detailProduct={detailProduct}
        beginOrder={beginOrder}
        setCertificatesOpen={setCertificatesOpen}
        setDetailProduct={setDetailProduct}
      />
    </div>
  );
}
