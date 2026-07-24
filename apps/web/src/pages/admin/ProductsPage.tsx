import { useCallback, useEffect, useState } from "react";
import type {
  Paginated,
  ProductInput,
  ProductRecord,
  ProductStatus,
} from "@landing/shared";
import {
  Boxes,
  Edit3,
  Plus,
  Save,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "@/components/icons";
import { api } from "@/api/client";
import { AdminLayout } from "@/components/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const statusLabels: Record<ProductStatus, string> = {
  draft: "Черновик",
  published: "Опубликован",
  archived: "В архиве",
};
const statusClasses: Record<ProductStatus, string> = {
  draft: "bg-amber-100 text-amber-800",
  published: "bg-emerald-100 text-emerald-800",
  archived: "bg-slate-100 text-slate-700",
};

type ProductForm = {
  name: string;
  slug: string;
  category: string;
  description: string;
  usesText: string;
  composition: string;
  preparation: string;
  imageUrl: string;
  status: ProductStatus;
  sortOrder: number;
  featured: boolean;
};

const emptyForm: ProductForm = {
  name: "",
  slug: "",
  category: "Для телят",
  description: "",
  usesText: "",
  composition: "",
  preparation: "",
  imageUrl: "/assets/agromilk/product-scene-bag.png",
  status: "draft",
  sortOrder: 100,
  featured: false,
};

function toForm(item: ProductRecord): ProductForm {
  return {
    name: item.name,
    slug: item.slug,
    category: item.category,
    description: item.description,
    usesText: item.uses.join("\n"),
    composition: item.composition,
    preparation: item.preparation,
    imageUrl: item.imageUrl || "",
    status: item.status,
    sortOrder: item.sortOrder,
    featured: item.featured,
  };
}

function slugify(value: string) {
  const transliteration: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "c",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
  };
  return value
    .toLowerCase()
    .split("")
    .map((char) => transliteration[char] ?? char)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ProductsPage() {
  const [data, setData] = useState<Paginated<ProductRecord> | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(() => {
    const params = new URLSearchParams({ page: "1", pageSize: "100" });
    if (search.trim()) params.set("search", search.trim());
    if (status) params.set("status", status);
    api.products
      .list(params)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [search, status]);

  useEffect(load, [load]);

  const update = <K extends keyof ProductForm>(key: K, value: ProductForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const edit = (item: ProductRecord) => {
    setSelectedId(item.id);
    setForm(toForm(item));
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetForm = () => {
    setSelectedId(null);
    setForm(emptyForm);
    setError("");
    setNotice("");
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setNotice("");
    const payload: ProductInput = {
      name: form.name,
      slug: form.slug || slugify(form.name),
      category: form.category,
      description: form.description,
      uses: form.usesText
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
      composition: form.composition,
      preparation: form.preparation,
      imageUrl: form.imageUrl,
      status: form.status,
      sortOrder: Number(form.sortOrder) || 0,
      featured: form.featured,
    };
    try {
      const saved = selectedId
        ? await api.products.update(selectedId, payload)
        : await api.products.create(payload);
      setSelectedId(saved.id);
      setForm(toForm(saved));
      setNotice("Изменения сохранены");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось сохранить продукт");
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const result = await api.media.upload(file);
      update("imageUrl", result.url);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Не удалось загрузить изображение",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Каталог продукции</h1>
          <p className="mt-1 text-slate-500">
            Управление карточками, характеристиками и порядком отображения на
            сайте.
          </p>
        </div>
        <Button onClick={resetForm}>
          <Plus size={18} />
          Новый продукт
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,.85fr)]">
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedId ? "Редактирование продукта" : "Новый продукт"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {error && (
              <div
                className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700"
                role="alert"
              >
                {error}
              </div>
            )}
            {notice && (
              <div
                className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                role="status"
              >
                {notice}
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium">
                Название
                <Input
                  className="mt-2"
                  value={form.name}
                  onChange={(e) => {
                    update("name", e.target.value);
                    if (!selectedId) update("slug", slugify(e.target.value));
                  }}
                  placeholder="ЗЦМ «Агромилк-2» 16%"
                />
              </label>
              <label className="text-sm font-medium">
                Slug
                <Input
                  className="mt-2"
                  value={form.slug}
                  onChange={(e) => update("slug", e.target.value)}
                  placeholder="zcm-agromilk-2-16"
                />
              </label>
              <label className="text-sm font-medium">
                Категория
                <Input
                  className="mt-2"
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                  placeholder="Для телят"
                />
              </label>
              <label className="text-sm font-medium">
                Порядок
                <Input
                  className="mt-2"
                  type="number"
                  min="0"
                  value={form.sortOrder}
                  onChange={(e) => update("sortOrder", Number(e.target.value))}
                />
              </label>
            </div>
            <label className="block text-sm font-medium">
              Краткое описание
              <Textarea
                className="mt-2 min-h-28"
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Кратко опишите назначение и ключевые свойства продукта"
              />
            </label>
            <label className="block text-sm font-medium">
              Применение{" "}
              <span className="font-normal text-slate-400">
                — один пункт в строке
              </span>
              <Textarea
                className="mt-2 min-h-32"
                value={form.usesText}
                onChange={(e) => update("usesText", e.target.value)}
                placeholder={
                  "Со 2-й недели жизни\nАвтоматические кормовые станции"
                }
              />
            </label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium">
                Состав
                <Textarea
                  className="mt-2 min-h-40"
                  value={form.composition}
                  onChange={(e) => update("composition", e.target.value)}
                />
              </label>
              <label className="text-sm font-medium">
                Приготовление
                <Textarea
                  className="mt-2 min-h-40"
                  value={form.preparation}
                  onChange={(e) => update("preparation", e.target.value)}
                />
              </label>
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <label className="text-sm font-medium">
                Изображение
                <Input
                  className="mt-2"
                  value={form.imageUrl}
                  onChange={(e) => update("imageUrl", e.target.value)}
                  placeholder="/uploads/..."
                />
              </label>
              <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-medium hover:bg-slate-50">
                <UploadCloud size={17} />
                {uploading ? "Загрузка…" : "Загрузить"}
                <input
                  className="hidden"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  disabled={uploading}
                  onChange={(e) => void uploadImage(e.target.files?.[0])}
                />
              </label>
            </div>
            {form.imageUrl && (
              <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <img
                  src={form.imageUrl}
                  alt="Предпросмотр"
                  className="h-24 w-24 rounded-lg object-contain bg-white"
                />
                <span className="break-all text-xs text-slate-500">
                  {form.imageUrl}
                </span>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium">
                Статус
                <Select
                  className="mt-2"
                  value={form.status}
                  onChange={(e) =>
                    update("status", e.target.value as ProductStatus)
                  }
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="flex items-center gap-3 self-end rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => update("featured", e.target.checked)}
                  className="size-4 accent-[var(--primary)]"
                />
                Отметить как популярный
              </label>
            </div>
            <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-5">
              <Button onClick={() => void save()} disabled={saving}>
                <Save size={17} />
                {saving ? "Сохраняем…" : "Сохранить"}
              </Button>
              {selectedId && (
                <>
                  <Button
                    variant="destructive"
                    disabled={deletingId === selectedId}
                    onClick={async () => {
                      if (!confirm(`Удалить «${form.name}»?`)) return;
                      setDeletingId(selectedId);
                      setError("");
                      try {
                        await api.products.remove(selectedId);
                        resetForm();
                        load();
                      } catch (cause) {
                        setError(
                          cause instanceof Error
                            ? cause.message
                            : "Не удалось удалить продукт",
                        );
                      } finally {
                        setDeletingId(null);
                      }
                    }}
                  >
                    <Trash2 size={17} />
                    {deletingId === selectedId ? "Удаляем…" : "Удалить"}
                  </Button>
                  <Button variant="outline" onClick={resetForm}>
                    <X size={17} />
                    Закрыть
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="h-fit xl:sticky xl:top-24">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes size={20} />
              Продукты на сайте
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_160px] xl:grid-cols-1">
              <div className="relative">
                <Search
                  className="absolute left-3 top-3.5 text-slate-400"
                  size={17}
                />
                <Input
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск по каталогу"
                />
              </div>
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Все статусы</option>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-3">
              {data?.items.length === 0 && (
                <p className="py-8 text-center text-sm text-slate-500">
                  Продукты не найдены
                </p>
              )}
              {data?.items.map((item) => (
                <article
                  key={item.id}
                  className={`rounded-xl border p-3 ${selectedId === item.id ? "border-[var(--ring)] bg-[var(--secondary)]" : "border-slate-200 bg-white"}`}
                >
                  <div className="flex gap-3">
                    <div className="grid size-16 shrink-0 place-items-center rounded-lg bg-slate-50">
                      <img
                        src={
                          item.imageUrl ||
                          "/assets/agromilk/product-scene-bag.png"
                        }
                        alt=""
                        className="max-h-14 max-w-12 object-contain"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold leading-tight">
                            {item.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {item.category} · порядок {item.sortOrder}
                          </p>
                        </div>
                        <Badge className={statusClasses[item.status]}>
                          {statusLabels[item.status]}
                        </Badge>
                      </div>
                      <div className="mt-3 flex justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => edit(item)}
                          aria-label="Редактировать"
                        >
                          <Edit3 size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:bg-red-50"
                          aria-label="Удалить"
                          disabled={deletingId === item.id}
                          onClick={async () => {
                            if (confirm(`Удалить «${item.name}»?`)) {
                              setDeletingId(item.id);
                              setError("");
                              try {
                                await api.products.remove(item.id);
                                if (selectedId === item.id) resetForm();
                                load();
                              } catch (cause) {
                                setError(
                                  cause instanceof Error
                                    ? cause.message
                                    : "Не удалось удалить продукт",
                                );
                              } finally {
                                setDeletingId(null);
                              }
                            }
                          }}
                        >
                          <Trash2 size={16} />
                          {deletingId === item.id ? "Удаляем…" : "Удалить"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
