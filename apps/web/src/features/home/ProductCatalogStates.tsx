import { Search } from "@/components/icons";

type ProductCatalogStatesProps = {
  loading: boolean;
  error: string;
  empty: boolean;
  retry: () => void;
  reset: () => void;
};

export function ProductCatalogStates({
  loading,
  error,
  empty,
  retry,
  reset,
}: ProductCatalogStatesProps) {
  if (loading) {
    return (
      <div className="agro-catalog-empty" role="status">
        <strong>Загружаем каталог…</strong>
      </div>
    );
  }
  if (error) {
    return (
      <div className="agro-catalog-empty" role="alert">
        <strong>Не удалось загрузить каталог</strong>
        <p>{error}</p>
        <button type="button" onClick={retry}>
          Попробовать снова
        </button>
      </div>
    );
  }
  if (!empty) return null;
  return (
    <div className="agro-catalog-empty">
      <Search size={28} />
      <strong>Ничего не найдено</strong>
      <p>Измените запрос или выберите другую категорию.</p>
      <button type="button" onClick={reset}>
        Сбросить фильтры
      </button>
    </div>
  );
}
