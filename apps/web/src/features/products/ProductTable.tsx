import type { ProductRecord, ProductStatus } from "@agromilk/shared";
import { Boxes, Edit3, Search, Trash2 } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { productStatusClasses, productStatusLabels } from "./product-status";

type ProductTableProps = {
  items: ProductRecord[];
  selectedId: string | null;
  search: string;
  status: ProductStatus | "";
  deletingId: string | null;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ProductStatus | "") => void;
  onEdit: (product: ProductRecord) => void;
  onDelete: (product: ProductRecord) => void;
};

export function ProductTable({
  items,
  selectedId,
  search,
  status,
  deletingId,
  onSearchChange,
  onStatusChange,
  onEdit,
  onDelete,
}: ProductTableProps) {
  return (
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
            <Search className="absolute left-3 top-3.5 text-slate-400" size={17} />
            <Input
              className="pl-9"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Поиск по каталогу"
            />
          </div>
          <Select
            value={status}
            onChange={(event) => onStatusChange(event.target.value as ProductStatus | "")}
          >
            <option value="">Все статусы</option>
            {Object.entries(productStatusLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-3">
          {items.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-500">Продукты не найдены</p>
          )}
          {items.map((item) => (
            <article
              key={item.id}
              className={`rounded-xl border p-3 ${selectedId === item.id ? "border-(--ring) bg-(--secondary)" : "border-slate-200 bg-white"}`}
            >
              <div className="flex gap-3">
                <div className="grid size-16 shrink-0 place-items-center rounded-lg bg-slate-50">
                  <img
                    src={item.imageUrl || "/assets/agromilk/product-scene-bag.webp"}
                    alt=""
                    className="max-h-14 max-w-12 object-contain"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold leading-tight">{item.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.category} · порядок {item.sortOrder}
                      </p>
                    </div>
                    <Badge className={productStatusClasses[item.status]}>
                      {productStatusLabels[item.status]}
                    </Badge>
                  </div>
                  <div className="mt-3 flex justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onEdit(item)}
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
                      onClick={() => onDelete(item)}
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
  );
}
