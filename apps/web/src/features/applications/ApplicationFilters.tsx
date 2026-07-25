import type { ApplicationStatus } from "@agromilk/shared";
import { Search } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { applicationStatusLabels } from "./application-status";

type ApplicationFiltersProps = {
  searchInput: string;
  status: ApplicationStatus | "";
  from: string;
  to: string;
  sort: "asc" | "desc";
  hasActiveFilters: boolean;
  onSearchInputChange: (value: string) => void;
  onStatusChange: (value: ApplicationStatus | "") => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onSortChange: (value: "asc" | "desc") => void;
  onSubmit: () => void;
  onReset: () => void;
};

export function ApplicationFilters({
  searchInput,
  status,
  from,
  to,
  sort,
  hasActiveFilters,
  onSearchInputChange,
  onStatusChange,
  onFromChange,
  onToChange,
  onSortChange,
  onSubmit,
  onReset,
}: ApplicationFiltersProps) {
  return (
    <>
      <form
        className="mb-5 grid gap-3 lg:grid-cols-[minmax(240px,1fr)_180px_150px_150px_150px_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <div className="relative">
          <Search className="absolute left-3 top-3.5 text-slate-400" size={17} />
          <Input
            className="pl-9"
            placeholder="Хозяйство, телефон или email"
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
          />
        </div>
        <Select
          value={status}
          onChange={(event) => onStatusChange(event.target.value as ApplicationStatus | "")}
        >
          <option value="">Все статусы</option>
          {Object.entries(applicationStatusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Input
          aria-label="Дата с"
          title="Дата с"
          type="date"
          value={from}
          onChange={(event) => onFromChange(event.target.value)}
        />
        <Input
          aria-label="Дата по"
          title="Дата по"
          type="date"
          value={to}
          min={from || undefined}
          onChange={(event) => onToChange(event.target.value)}
        />
        <Select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as "asc" | "desc")}
          aria-label="Сортировка"
        >
          <option value="desc">Сначала новые</option>
          <option value="asc">Сначала старые</option>
        </Select>
        <Button type="submit">Найти</Button>
      </form>
      {hasActiveFilters && (
        <button className="mb-5 text-sm font-medium text-blue-700" type="button" onClick={onReset}>
          Сбросить фильтры
        </button>
      )}
    </>
  );
}
