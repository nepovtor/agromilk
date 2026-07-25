import { useCallback, useState } from "react";
import type { ApplicationStatus } from "@agromilk/shared";

export function useApplicationFilters() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusValue, setStatusValue] = useState<ApplicationStatus | "">("");
  const [fromValue, setFromValue] = useState("");
  const [toValue, setToValue] = useState("");
  const [sortValue, setSortValue] = useState<"desc" | "asc">("desc");

  const queryFor = useCallback(
    (pageValue = page, pageSize = 20) => {
      const query = new URLSearchParams({
        page: String(pageValue),
        pageSize: String(pageSize),
        sort: sortValue,
      });
      if (search) query.set("search", search);
      if (statusValue) query.set("status", statusValue);
      if (fromValue) query.set("from", fromValue);
      if (toValue) query.set("to", toValue);
      return query;
    },
    [fromValue, page, search, sortValue, statusValue, toValue],
  );

  return {
    page,
    setPage,
    searchInput,
    setSearchInput,
    status: statusValue,
    from: fromValue,
    to: toValue,
    sort: sortValue,
    queryFor,
    hasActiveFilters: Boolean(search || statusValue || fromValue || toValue),
    setStatus: (value: ApplicationStatus | "") => {
      setStatusValue(value);
      setPage(1);
    },
    setFrom: (value: string) => {
      setFromValue(value);
      setPage(1);
    },
    setTo: (value: string) => {
      setToValue(value);
      setPage(1);
    },
    setSort: (value: "asc" | "desc") => {
      setSortValue(value);
      setPage(1);
    },
    submitSearch: () => {
      setPage(1);
      setSearch(searchInput.trim());
    },
    resetFilters: () => {
      setSearchInput("");
      setSearch("");
      setStatusValue("");
      setFromValue("");
      setToValue("");
      setPage(1);
    },
  };
}
