import type { Dispatch, SetStateAction } from "react";
import { Search, X } from "@/components/icons";

type ProductCatalogFiltersProps = {
  categories: string[];
  category: string;
  search: string;
  count: number;
  setCategory: Dispatch<SetStateAction<string>>;
  setSearch: Dispatch<SetStateAction<string>>;
};

export function ProductCatalogFilters({
  categories,
  category,
  search,
  count,
  setCategory,
  setSearch,
}: ProductCatalogFiltersProps) {
  return (
    <div className="agro-catalog-tools">
      <label className="agro-catalog-search">
        <Search size={18} />
        <span className="sr-only">Поиск по каталогу</span>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Найти продукт или применение"
        />
        {search && (
          <button type="button" onClick={() => setSearch("")} aria-label="Очистить поиск">
            <X size={17} />
          </button>
        )}
      </label>
      <div className="agro-category-filter" aria-label="Категории продуктов">
        {categories.map((item) => (
          <button
            className={category === item ? "is-active" : ""}
            type="button"
            key={item}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <span className="agro-catalog-count">Найдено: {count}</span>
    </div>
  );
}
