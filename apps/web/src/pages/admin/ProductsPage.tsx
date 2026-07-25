import { useCallback, useEffect, useState } from "react";
import type { Paginated, ProductRecord, ProductStatus } from "@agromilk/shared";
import { Plus } from "@/components/icons";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { api } from "@/api";
import { ProductForm } from "@/features/products/ProductForm";
import { ProductTable } from "@/features/products/ProductTable";
import {
  emptyProductForm,
  formToProductInput,
  productToForm,
  type ProductFormValues,
} from "@/features/products/product-form.mapper";
import { slugify } from "@/lib/utils";

export function ProductsPage() {
  const [data, setData] = useState<Paginated<ProductRecord> | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProductStatus | "">("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormValues>(emptyProductForm);
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
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "Не удалось загрузить продукты");
      });
  }, [search, status]);

  useEffect(load, [load]);

  const update = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const resetForm = () => {
    setSelectedId(null);
    setForm(emptyProductForm);
    setError("");
    setNotice("");
  };

  const edit = (item: ProductRecord) => {
    setSelectedId(item.id);
    setForm(productToForm(item));
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = formToProductInput(form, form.slug || slugify(form.name));
      const saved = selectedId
        ? await api.products.update(selectedId, payload)
        : await api.products.create(payload);
      setSelectedId(saved.id);
      setForm(productToForm(saved));
      setNotice("Изменения сохранены");
      load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось сохранить продукт");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: ProductRecord) => {
    if (!confirm(`Удалить «${item.name}»?`)) return;
    setDeletingId(item.id);
    setError("");
    try {
      await api.products.remove(item.id);
      if (selectedId === item.id) resetForm();
      load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось удалить продукт");
    } finally {
      setDeletingId(null);
    }
  };

  const uploadImage = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const result = await api.media.upload(file);
      update("imageUrl", result.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось загрузить изображение");
    } finally {
      setUploading(false);
    }
  };

  const selectedProduct = selectedId
    ? data?.items.find((item) => item.id === selectedId)
    : undefined;

  return (
    <AdminLayout>
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Каталог продукции</h1>
          <p className="mt-1 text-slate-500">
            Управление карточками, характеристиками и порядком отображения на сайте.
          </p>
        </div>
        <Button onClick={resetForm}>
          <Plus size={18} />
          Новый продукт
        </Button>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(420px,.85fr)]">
        <ProductForm
          selectedId={selectedId}
          values={form}
          error={error}
          notice={notice}
          saving={saving}
          deleting={deletingId === selectedId}
          uploading={uploading}
          onChange={update}
          onSave={() => void save()}
          onDelete={() => selectedProduct && void remove(selectedProduct)}
          onClose={resetForm}
          onUpload={(file) => void uploadImage(file)}
        />
        <ProductTable
          items={data?.items ?? []}
          selectedId={selectedId}
          search={search}
          status={status}
          deletingId={deletingId}
          onSearchChange={setSearch}
          onStatusChange={setStatus}
          onEdit={edit}
          onDelete={(item) => void remove(item)}
        />
      </div>
    </AdminLayout>
  );
}
