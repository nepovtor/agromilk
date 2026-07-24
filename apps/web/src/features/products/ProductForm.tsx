import type { ProductStatus } from "@landing/shared";
import { Save, Trash2, UploadCloud, X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/utils";
import type { ProductFormValues } from "./product-form.mapper";
import { productStatusLabels } from "./product-status";

type ProductFormProps = {
  selectedId: string | null;
  values: ProductFormValues;
  error: string;
  notice: string;
  saving: boolean;
  deleting: boolean;
  uploading: boolean;
  onChange: <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => void;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
  onUpload: (file?: File) => void;
};

export function ProductForm({
  selectedId,
  values,
  error,
  notice,
  saving,
  deleting,
  uploading,
  onChange,
  onSave,
  onDelete,
  onClose,
  onUpload,
}: ProductFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{selectedId ? "Редактирование продукта" : "Новый продукт"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
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
              value={values.name}
              onChange={(event) => {
                onChange("name", event.target.value);
                if (!selectedId) onChange("slug", slugify(event.target.value));
              }}
              placeholder="ЗЦМ «Агромилк-2» 16%"
            />
          </label>
          <label className="text-sm font-medium">
            Slug
            <Input
              className="mt-2"
              value={values.slug}
              onChange={(event) => onChange("slug", event.target.value)}
              placeholder="zcm-agromilk-2-16"
            />
          </label>
          <label className="text-sm font-medium">
            Категория
            <Input
              className="mt-2"
              value={values.category}
              onChange={(event) => onChange("category", event.target.value)}
              placeholder="Для телят"
            />
          </label>
          <label className="text-sm font-medium">
            Порядок
            <Input
              className="mt-2"
              type="number"
              min="0"
              value={values.sortOrder}
              onChange={(event) => onChange("sortOrder", Number(event.target.value))}
            />
          </label>
        </div>
        <label className="block text-sm font-medium">
          Краткое описание
          <Textarea
            className="mt-2 min-h-28"
            value={values.description}
            onChange={(event) => onChange("description", event.target.value)}
            placeholder="Кратко опишите назначение и ключевые свойства продукта"
          />
        </label>
        <label className="block text-sm font-medium">
          Применение <span className="font-normal text-slate-400">— один пункт в строке</span>
          <Textarea
            className="mt-2 min-h-32"
            value={values.usesText}
            onChange={(event) => onChange("usesText", event.target.value)}
            placeholder={"Со 2-й недели жизни\nАвтоматические кормовые станции"}
          />
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">
            Состав
            <Textarea
              className="mt-2 min-h-40"
              value={values.composition}
              onChange={(event) => onChange("composition", event.target.value)}
            />
          </label>
          <label className="text-sm font-medium">
            Приготовление
            <Textarea
              className="mt-2 min-h-40"
              value={values.preparation}
              onChange={(event) => onChange("preparation", event.target.value)}
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <label className="text-sm font-medium">
            Изображение
            <Input
              className="mt-2"
              value={values.imageUrl}
              onChange={(event) => onChange("imageUrl", event.target.value)}
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
              onChange={(event) => onUpload(event.target.files?.[0])}
            />
          </label>
        </div>
        {values.imageUrl && (
          <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <img
              src={values.imageUrl}
              alt="Предпросмотр"
              className="h-24 w-24 rounded-lg bg-white object-contain"
            />
            <span className="break-all text-xs text-slate-500">{values.imageUrl}</span>
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">
            Статус
            <Select
              className="mt-2"
              value={values.status}
              onChange={(event) => onChange("status", event.target.value as ProductStatus)}
            >
              {Object.entries(productStatusLabels).map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
          <label className="flex items-center gap-3 self-end rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium">
            <input
              type="checkbox"
              checked={values.featured}
              onChange={(event) => onChange("featured", event.target.checked)}
              className="size-4 accent-(--primary)"
            />
            Отметить как популярный
          </label>
        </div>
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-5">
          <Button onClick={onSave} disabled={saving}>
            <Save size={17} />
            {saving ? "Сохраняем…" : "Сохранить"}
          </Button>
          {selectedId && (
            <>
              <Button variant="destructive" disabled={deleting} onClick={onDelete}>
                <Trash2 size={17} />
                {deleting ? "Удаляем…" : "Удалить"}
              </Button>
              <Button variant="outline" onClick={onClose}>
                <X size={17} />
                Закрыть
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
