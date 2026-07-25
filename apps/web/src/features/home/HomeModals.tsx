import type { Dispatch, SetStateAction } from "react";
import type { ProductRecord } from "@agromilk/shared";
import { ArrowRight, Check, X } from "@/components/icons";
import { agromilkAsset as asset } from "@/lib/agromilkAssets";

type HomeModalsProps = {
  certificatesOpen: boolean;
  detailProduct: ProductRecord | null;
  beginOrder: (product?: ProductRecord) => void;
  setCertificatesOpen: Dispatch<SetStateAction<boolean>>;
  setDetailProduct: Dispatch<SetStateAction<ProductRecord | null>>;
};

export function HomeModals({
  certificatesOpen,
  detailProduct,
  beginOrder,
  setCertificatesOpen,
  setDetailProduct,
}: HomeModalsProps) {
  return (
    <>
      {detailProduct && (
        <div
          className="agro-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDetailProduct(null);
          }}
        >
          <div
            className="agro-modal__panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-modal-title"
          >
            <button
              className="agro-modal__close"
              type="button"
              onClick={() => setDetailProduct(null)}
              aria-label="Закрыть"
            >
              <X size={22} />
            </button>
            <div className="agro-modal__hero">
              <div>
                <span>{detailProduct.category}</span>
                <h2 id="product-modal-title">{detailProduct.name}</h2>
                <p>{detailProduct.description}</p>
              </div>
              <img
                src={detailProduct.imageUrl || asset("product-scene-bag.webp")}
                alt={detailProduct.name}
              />
            </div>
            <div className="agro-modal__columns">
              <section>
                <h3>Применение</h3>
                <ul>
                  {detailProduct.uses.map((use) => (
                    <li key={use}>
                      <Check size={16} />
                      {use}
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h3>Состав</h3>
                <p>
                  {detailProduct.composition ||
                    "Точные показатели и состав указаны в документации к партии."}
                </p>
              </section>
              <section>
                <h3>Приготовление</h3>
                <p>
                  {detailProduct.preparation ||
                    "Используйте рекомендации, указанные в инструкции к продукту."}
                </p>
              </section>
            </div>
            <div className="agro-modal__footer">
              <p>Точную дозировку и документы предоставим при расчёте заказа.</p>
              <button
                className="agro-btn agro-btn--primary"
                type="button"
                onClick={() => beginOrder(detailProduct)}
              >
                Запросить расчёт <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
      {certificatesOpen && (
        <div
          className="agro-modal agro-certificate-modal"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCertificatesOpen(false);
          }}
        >
          <div
            className="agro-certificate-modal__panel"
            role="dialog"
            aria-modal="true"
            aria-label="Сертификаты качества"
          >
            <button
              className="agro-modal__close"
              type="button"
              onClick={() => setCertificatesOpen(false)}
              aria-label="Закрыть"
            >
              <X size={22} />
            </button>
            <img
              src={asset("certificates.webp")}
              alt="Сертификаты качества Агромилк в увеличенном виде"
            />
          </div>
        </div>
      )}
    </>
  );
}
