import { useEffect, useState } from "react";
import type { ArticleRecord, ArticleStatus, Paginated } from "@landing/shared";
import { Link } from "wouter";
import { Edit3, ExternalLink, Plus, Search, Trash2 } from "@/components/icons";
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
import { formatDate } from "@/lib/utils";

const labels: Record<ArticleStatus, string> = {
  draft: "Черновик",
  published: "Опубликована",
  archived: "В архиве",
};
const colors: Record<ArticleStatus, string> = {
  draft: "bg-amber-100 text-amber-800",
  published: "bg-[#e8f5df] text-[#275a24]",
  archived: "bg-slate-100 text-slate-700",
};
export function ArticlesPage() {
  const [data, setData] = useState<Paginated<ArticleRecord> | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const load = () => {
    const q = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (search) q.set("search", search);
    if (status) q.set("status", status);
    api.articles
      .list(q)
      .then(setData)
      .catch((e) => setError(e.message));
  };
  useEffect(load, [page, status, search]);
  return (
    <AdminLayout>
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Агро-инструкции</h1>
          <p className="mt-1 text-slate-500">
            Материалы для кормления, ухода и работы с хозяйствами.
          </p>
        </div>
        <Link href="/admin/articles/new">
          <Button>
            <Plus size={18} />
            Новый материал
          </Button>
        </Link>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3.5 text-slate-400" size={17} />
              <Input
                className="pl-9"
                placeholder="Культура, тема или slug"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setPage(1);
                    load();
                  }
                }}
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
                <option value={v} key={v}>
                  {l}
                </option>
              ))}
            </Select>
            <Button
              onClick={() => {
                setPage(1);
                load();
              }}
            >
              Найти
            </Button>
          </div>
          {error && <p className="mb-4 text-red-600">{error}</p>}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Материал</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Обновлена</TableHead>
                <TableHead className="text-right">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-slate-500">
                    Материалов не найдено
                  </TableCell>
                </TableRow>
              ) : (
                data?.items.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <p className="font-medium">{a.title}</p>
                      <p className="mt-1 text-xs text-slate-500">/{a.slug}</p>
                    </TableCell>
                    <TableCell>
                      <Badge className={colors[a.status]}>{labels[a.status]}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(a.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        {a.status === "published" && (
                          <a href={`/instructions/${a.slug}`} target="_blank" rel="noreferrer">
                            <Button size="icon" variant="ghost">
                              <ExternalLink size={17} />
                            </Button>
                          </a>
                        )}
                        <Link href={`/admin/articles/${a.id}/edit`}>
                          <Button size="icon" variant="ghost">
                            <Edit3 size={17} />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:bg-red-50"
                          disabled={deletingId === a.id}
                          onClick={async () => {
                            if (confirm(`Удалить «${a.title}»?`)) {
                              setDeletingId(a.id);
                              setError("");
                              try {
                                await api.articles.remove(a.id);
                                load();
                              } catch (cause) {
                                setError(
                                  cause instanceof Error
                                    ? cause.message
                                    : "Не удалось удалить материал",
                                );
                              } finally {
                                setDeletingId(null);
                              }
                            }
                          }}
                        >
                          <Trash2 size={17} />
                          {deletingId === a.id ? "Удаляем…" : "Удалить"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <AdminPagination
            page={page}
            totalItems={data?.pagination.totalItems ?? 0}
            totalPages={data?.pagination.totalPages ?? 1}
            onPageChange={setPage}
          />
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
