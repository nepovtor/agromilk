import { useCallback, useEffect, useState } from "react";
import type {
  ApplicationRecord,
  ApplicationStatus,
  Paginated,
  UpdateApplicationInput,
} from "@landing/shared";
import { api } from "@/api";
import { applicationStatusLabels } from "@/features/applications/application-status";

type UseApplicationsOptions = {
  applicationId?: string;
  navigate: (path: string) => void;
};

function errorMessage(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause.message : fallback;
}

export function useApplications({ applicationId, navigate }: UseApplicationsOptions) {
  const [data, setData] = useState<Paginated<ApplicationRecord> | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ApplicationStatus | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<"desc" | "asc">("desc");
  const [selected, setSelected] = useState<ApplicationRecord | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<ApplicationStatus>("in_progress");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const queryFor = useCallback(
    (pageValue = page, pageSize = 20) => {
      const query = new URLSearchParams({
        page: String(pageValue),
        pageSize: String(pageSize),
        sort,
      });
      if (search) query.set("search", search);
      if (status) query.set("status", status);
      if (from) query.set("from", from);
      if (to) query.set("to", to);
      return query;
    },
    [from, page, search, sort, status, to],
  );

  const replaceInList = useCallback((item: ApplicationRecord) => {
    setData((current) =>
      current
        ? { ...current, items: current.items.map((entry) => (entry.id === item.id ? item : entry)) }
        : current,
    );
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.applications.list(queryFor());
      setData(result);
      setSelectedIds(new Set());
      setError("");
    } catch (cause) {
      setError(errorMessage(cause, "Не удалось загрузить заявки"));
    } finally {
      setLoading(false);
    }
  }, [queryFor]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  useEffect(() => {
    if (!applicationId) return;
    api.applications
      .get(applicationId)
      .then((item) => {
        setSelected(item);
        replaceInList(item);
      })
      .catch((cause: unknown) => setError(errorMessage(cause, "Не удалось загрузить заявку")));
  }, [applicationId, replaceInList]);

  const open = useCallback(
    async (id: string) => {
      try {
        const item = await api.applications.get(id);
        setSelected(item);
        replaceInList(item);
        navigate(`/admin/applications/${id}`);
      } catch (cause) {
        setError(errorMessage(cause, "Не удалось загрузить заявку"));
      }
    },
    [navigate, replaceInList],
  );

  const update = useCallback(
    async (id: string, changes: UpdateApplicationInput) => {
      const item = await api.applications.update(id, changes);
      setSelected(item);
      replaceInList(item);
      return item;
    },
    [replaceInList],
  );

  const remove = useCallback(
    async (item: ApplicationRecord) => {
      if (!confirm(`Удалить заявку от «${item.name}» без возможности восстановления?`)) return;
      setDeletingId(item.id);
      setError("");
      try {
        await api.applications.remove(item.id);
        await load();
      } catch (cause) {
        setError(errorMessage(cause, "Не удалось удалить заявку"));
      } finally {
        setDeletingId(null);
      }
    },
    [load],
  );

  const deleteSelected = useCallback(async () => {
    if (!selected) return;
    await api.applications.remove(selected.id);
    setSelected(null);
    navigate("/admin/applications");
    await load();
  }, [load, navigate, selected]);

  const applyBulkStatus = useCallback(async () => {
    if (!selectedIds.size) return;
    setBulkSaving(true);
    setError("");
    try {
      await api.applications.bulkUpdate([...selectedIds], bulkStatus);
      await load();
    } catch (cause) {
      setError(errorMessage(cause, "Не удалось изменить заявки"));
    } finally {
      setBulkSaving(false);
    }
  }, [bulkStatus, load, selectedIds]);

  const exportCsv = useCallback(async () => {
    setExporting(true);
    setError("");
    try {
      const first = await api.applications.list(queryFor(1, 100));
      const pages: Paginated<ApplicationRecord>[] = [];
      for (let nextPage = 2; nextPage <= first.pagination.totalPages; nextPage += 1)
        pages.push(await api.applications.list(queryFor(nextPage, 100)));
      const rows = [
        ["Дата", "Клиент", "Телефон", "Email", "Сообщение", "Статус", "Комментарий", "Источник"],
        ...[first, ...pages].flatMap((response) =>
          response.items.map((item) => [
            item.createdAt,
            item.name,
            item.phone,
            item.email,
            item.message,
            applicationStatusLabels[item.status],
            item.adminComment,
            item.sourcePage,
          ]),
        ),
      ];
      const escape = (value: string | null | undefined) => `"${(value ?? "").replace(/"/g, '""')}"`;
      const blob = new Blob([`\ufeff${rows.map((row) => row.map(escape).join(";")).join("\n")}`], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `agromilk-applications-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (cause) {
      setError(errorMessage(cause, "Не удалось выгрузить заявки"));
    } finally {
      setExporting(false);
    }
  }, [queryFor]);

  return {
    data,
    error,
    loading,
    page,
    setPage,
    searchInput,
    setSearchInput,
    status,
    from,
    to,
    sort,
    selected,
    selectedIds,
    bulkStatus,
    bulkSaving,
    exporting,
    deletingId,
    hasActiveFilters: Boolean(search || status || from || to),
    setStatus: (value: ApplicationStatus | "") => {
      setStatus(value);
      setPage(1);
    },
    setFrom: (value: string) => {
      setFrom(value);
      setPage(1);
    },
    setTo: (value: string) => {
      setTo(value);
      setPage(1);
    },
    setSort: (value: "asc" | "desc") => {
      setSort(value);
      setPage(1);
    },
    submitSearch: () => {
      setPage(1);
      setSearch(searchInput.trim());
    },
    resetFilters: () => {
      setSearchInput("");
      setSearch("");
      setStatus("");
      setFrom("");
      setTo("");
      setPage(1);
    },
    setBulkStatus,
    clearSelection: () => setSelectedIds(new Set()),
    toggleSelection: (id: string, selectedValue: boolean) =>
      setSelectedIds((current) => {
        const next = new Set(current);
        if (selectedValue) next.add(id);
        else next.delete(id);
        return next;
      }),
    toggleVisibleSelection: (selectedValue: boolean) =>
      setSelectedIds((current) => {
        const next = new Set(current);
        (data?.items ?? []).forEach((item) => {
          if (selectedValue) next.add(item.id);
          else next.delete(item.id);
        });
        return next;
      }),
    open,
    update,
    remove,
    deleteSelected,
    applyBulkStatus,
    exportCsv,
    closeDetails: () => {
      setSelected(null);
      navigate("/admin/applications");
    },
  };
}
