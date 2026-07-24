import { useCallback, useEffect, useState } from "react";
import type { ApplicationRecord, ApplicationStatus, Paginated } from "@landing/shared";
import { useLocation, useParams } from "wouter";
import { CheckCircle2, Eye, FileText, Search, Trash2, X } from "@/components/icons";
import { api } from "@/api/client";
import { AdminLayout } from "@/components/AdminLayout";
import { AdminPagination } from "@/components/admin/AdminPagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";

const labels: Record<ApplicationStatus, string> = {
  new: "Новая",
  viewed: "Просмотрена",
  in_progress: "В работе",
  completed: "Завершена",
  rejected: "Отклонена",
};
const badgeClass: Record<ApplicationStatus, string> = {
  new: "bg-[#e7f1fb] text-[#0164b1]",
  viewed: "bg-slate-100 text-slate-700",
  in_progress: "bg-amber-100 text-amber-800",
  completed: "bg-[#e8f5df] text-[#275a24]",
  rejected: "bg-red-100 text-red-800",
};

export function ApplicationsPage() {
  const { id } = useParams<{ id?: string }>();
  const [, navigate] = useLocation();
  const [data, setData] = useState<Paginated<ApplicationRecord> | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
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
      const q = new URLSearchParams({
        page: String(pageValue),
        pageSize: String(pageSize),
        sort,
      });
      if (search.trim()) q.set("search", search.trim());
      if (status) q.set("status", status);
      if (from) q.set("from", from);
      if (to) q.set("to", to);
      return q;
    },
    [from, page, search, sort, status, to],
  );

  const load = useCallback(() => {
    api.applications
      .list(queryFor())
      .then((result) => {
        setData(result);
        setSelectedIds(new Set());
        setError("");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Не удалось загрузить заявки"))
      .finally(() => setLoading(false));
  }, [queryFor]);
  const open = useCallback(
    async (applicationId: string) => {
      try {
        const item = await api.applications.get(applicationId);
        setSelected(item);
        setData((current) =>
          current
            ? {
                ...current,
                items: current.items.map((entry) => (entry.id === item.id ? item : entry)),
              }
            : current,
        );
        navigate(`/admin/applications/${applicationId}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Ошибка");
      }
    },
    [navigate],
  );
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (!id) return;
    api.applications
      .get(id)
      .then((item) => {
        setSelected(item);
        setData((current) =>
          current
            ? {
                ...current,
                items: current.items.map((entry) => (entry.id === item.id ? item : entry)),
              }
            : current,
        );
      })
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Ошибка"));
  }, [id]);

  const visibleIds = data?.items.map((item) => item.id) ?? [];
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((itemId) => selectedIds.has(itemId));

  const exportCsv = async () => {
    setExporting(true);
    setError("");
    try {
      const first = await api.applications.list(queryFor(1, 100));
      const responses: Paginated<ApplicationRecord>[] = [];
      for (let nextPage = 2; nextPage <= first.pagination.totalPages; nextPage += 1) {
        responses.push(await api.applications.list(queryFor(nextPage, 100)));
      }
      const items = [first, ...responses].flatMap((response) => response.items);
      const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
      const rows = [
        ["Дата", "Клиент", "Телефон", "Email", "Сообщение", "Статус", "Комментарий", "Источник"],
        ...items.map((item) => [
          item.createdAt,
          item.name,
          item.phone,
          item.email,
          item.message,
          labels[item.status],
          item.adminComment,
          item.sourcePage,
        ]),
      ];
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
      setError(cause instanceof Error ? cause.message : "Не удалось выгрузить заявки");
    } finally {
      setExporting(false);
    }
  };

  const applyBulkStatus = async () => {
    if (!selectedIds.size) return;
    setBulkSaving(true);
    setError("");
    try {
      await api.applications.bulkUpdate([...selectedIds], bulkStatus);
      load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось изменить заявки");
    } finally {
      setBulkSaving(false);
    }
  };
  return (
    <AdminLayout>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Заявки</h1>
          <p className="mt-1 text-slate-500">
            Запросы хозяйств на продукцию, консультации и поставки.
          </p>
        </div>
        <Button variant="outline" disabled={exporting} onClick={() => void exportCsv()}>
          <FileText size={17} />
          {exporting ? "Готовим файл…" : "Выгрузить CSV"}
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          <form
            className="mb-5 grid gap-3 lg:grid-cols-[minmax(240px,1fr)_180px_150px_150px_150px_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              setPage(1);
              setSearch(searchInput);
            }}
          >
            <div className="relative">
              <Search className="absolute left-3 top-3.5 text-slate-400" size={17} />
              <Input
                className="pl-9"
                placeholder="Хозяйство, телефон или email"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">Все статусы</option>
              {Object.entries(labels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
            <Input
              aria-label="Дата с"
              title="Дата с"
              type="date"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                setPage(1);
              }}
            />
            <Input
              aria-label="Дата по"
              title="Дата по"
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) => {
                setTo(event.target.value);
                setPage(1);
              }}
            />
            <Select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as "desc" | "asc");
                setPage(1);
              }}
              aria-label="Сортировка"
            >
              <option value="desc">Сначала новые</option>
              <option value="asc">Сначала старые</option>
            </Select>
            <Button type="submit">Найти</Button>
          </form>
          {(search || status || from || to) && (
            <button
              className="mb-5 text-sm font-medium text-blue-700"
              type="button"
              onClick={() => {
                setSearchInput("");
                setSearch("");
                setStatus("");
                setFrom("");
                setTo("");
                setPage(1);
              }}
            >
              Сбросить фильтры
            </button>
          )}
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          {selectedIds.size > 0 && (
            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3 sm:flex-row sm:items-center">
              <span className="text-sm font-semibold text-blue-900">
                Выбрано: {selectedIds.size}
              </span>
              <Select
                className="sm:ml-auto sm:w-48"
                value={bulkStatus}
                onChange={(event) => setBulkStatus(event.target.value as ApplicationStatus)}
              >
                {Object.entries(labels).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </Select>
              <Button size="sm" disabled={bulkSaving} onClick={() => void applyBulkStatus()}>
                <CheckCircle2 size={16} />
                {bulkSaving ? "Обновляем…" : "Изменить статус"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
                Отменить выбор
              </Button>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    aria-label="Выбрать заявки на странице"
                    checked={allVisibleSelected}
                    onChange={(event) =>
                      setSelectedIds((current) => {
                        const next = new Set(current);
                        visibleIds.forEach((itemId) =>
                          event.target.checked ? next.add(itemId) : next.delete(itemId),
                        );
                        return next;
                      })
                    }
                  />
                </TableHead>
                <TableHead>Дата</TableHead>
                <TableHead>Клиент / хозяйство</TableHead>
                <TableHead>Связь</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && !data ? (
                <TableRow>
                  <TableCell colSpan={6}>Загрузка…</TableCell>
                </TableRow>
              ) : data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-slate-500">
                    Запросов не найдено
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((item) => (
                  <TableRow
                    key={item.id}
                    className={selectedIds.has(item.id) ? "bg-blue-50" : undefined}
                  >
                    <TableCell>
                      <input
                        type="checkbox"
                        aria-label={`Выбрать заявку ${item.name}`}
                        checked={selectedIds.has(item.id)}
                        onChange={(event) =>
                          setSelectedIds((current) => {
                            const next = new Set(current);
                            if (event.target.checked) next.add(item.id);
                            else next.delete(item.id);
                            return next;
                          })
                        }
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDate(item.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <div>{item.phone}</div>
                      <div className="text-xs text-slate-500">{item.email || "—"}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={badgeClass[item.status]}>{labels[item.status]}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Открыть заявку"
                          onClick={() => void open(item.id)}
                        >
                          <Eye size={17} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          disabled={deletingId === item.id}
                          onClick={async () => {
                            if (
                              !confirm(
                                `Удалить заявку от «${item.name}» без возможности восстановления?`,
                              )
                            )
                              return;
                            setDeletingId(item.id);
                            setError("");
                            try {
                              await api.applications.remove(item.id);
                              load();
                            } catch (cause) {
                              setError(
                                cause instanceof Error
                                  ? cause.message
                                  : "Не удалось удалить заявку",
                              );
                            } finally {
                              setDeletingId(null);
                            }
                          }}
                        >
                          <Trash2 size={16} />
                          {deletingId === item.id ? "Удаляем…" : "Удалить"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <AdminPagination
            className="flex-col gap-3 sm:flex-row sm:items-center"
            page={page}
            showPageIndicator
            totalItems={data?.pagination.totalItems ?? 0}
            totalPages={data?.pagination.totalPages ?? 1}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
      {selected && (
        <ApplicationPanel
          key={selected.id}
          item={selected}
          onClose={() => {
            setSelected(null);
            navigate("/admin/applications");
          }}
          onChanged={(updated) => {
            setSelected(updated);
            load();
          }}
          onDeleted={() => {
            setSelected(null);
            navigate("/admin/applications");
            load();
          }}
        />
      )}
    </AdminLayout>
  );
}
function ApplicationPanel({
  item,
  onClose,
  onChanged,
  onDeleted,
}: {
  item: ApplicationRecord;
  onClose: () => void;
  onChanged: (v: ApplicationRecord) => void;
  onDeleted: () => void;
}) {
  const [status, setStatus] = useState<ApplicationStatus>(item.status);
  const [comment, setComment] = useState(item.adminComment || "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/35" onClick={onClose} role="presentation">
      <aside
        className="ml-auto h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-panel-title"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold" id="application-panel-title">
              Карточка запроса
            </h2>
            <p className="mt-1 text-sm text-slate-500">{formatDate(item.createdAt)}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X />
          </Button>
        </div>
        <div className="mt-8 space-y-5">
          <Info label="Клиент / хозяйство" value={item.name} />
          <div className="grid gap-2 sm:grid-cols-2">
            <a
              className="rounded-xl border border-slate-200 p-3 transition hover:border-blue-300 hover:bg-blue-50"
              href={`tel:${item.phone.replace(/[^+\d]/g, "")}`}
            >
              <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Позвонить
              </span>
              <strong className="mt-1 block text-sm text-blue-700">{item.phone}</strong>
            </a>
            {item.email ? (
              <a
                className="rounded-xl border border-slate-200 p-3 transition hover:border-blue-300 hover:bg-blue-50"
                href={`mailto:${item.email}`}
              >
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Написать
                </span>
                <strong className="mt-1 block truncate text-sm text-blue-700">{item.email}</strong>
              </a>
            ) : (
              <Info label="Email" value="Не указан" />
            )}
          </div>
          <Info label="Потребность" value={item.message || "—"} />
          <Info label="Источник" value={item.sourcePage || "—"} />
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Статус</span>
            <Select
              className="w-full"
              value={status}
              onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
            >
              {Object.entries(labels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Рабочая заметка агронома</span>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} />
          </label>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <Button
            className="w-full"
            disabled={saving || deleting}
            onClick={async () => {
              setSaving(true);
              setError("");
              try {
                onChanged(
                  await api.applications.update(item.id, {
                    status,
                    adminComment: comment,
                  }),
                );
              } catch (cause) {
                setError(cause instanceof Error ? cause.message : "Не удалось сохранить заявку");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Сохранение…" : "Сохранить"}
          </Button>
          <Button
            variant="destructive"
            className="w-full"
            disabled={saving || deleting}
            onClick={async () => {
              if (confirm("Удалить заявку без возможности восстановления?")) {
                setDeleting(true);
                setError("");
                try {
                  await api.applications.remove(item.id);
                  onDeleted();
                } catch (cause) {
                  setError(cause instanceof Error ? cause.message : "Не удалось удалить заявку");
                  setDeleting(false);
                }
              }
            }}
          >
            <Trash2 size={17} />
            {deleting ? "Удаляем…" : "Удалить заявку"}
          </Button>
        </div>
      </aside>
    </div>
  );
}
function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{value}</p>
    </div>
  );
}
