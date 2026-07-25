import type { ApplicationRecord } from "@agromilk/shared";
import { Eye, Trash2 } from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { applicationStatusBadgeClass, applicationStatusLabels } from "./application-status";

type ApplicationTableProps = {
  items: ApplicationRecord[];
  loading: boolean;
  selectedIds: Set<string>;
  deletingId: string | null;
  onToggle: (id: string, selected: boolean) => void;
  onToggleAll: (selected: boolean) => void;
  onOpen: (id: string) => void;
  onDelete: (application: ApplicationRecord) => void;
};

export function ApplicationTable({
  items,
  loading,
  selectedIds,
  deletingId,
  onToggle,
  onToggleAll,
  onOpen,
  onDelete,
}: ApplicationTableProps) {
  const allVisibleSelected = items.length > 0 && items.every((item) => selectedIds.has(item.id));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10">
            <input
              type="checkbox"
              aria-label="Выбрать заявки на странице"
              checked={allVisibleSelected}
              onChange={(event) => onToggleAll(event.target.checked)}
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
        {loading && !items.length ? (
          <TableRow>
            <TableCell colSpan={6}>Загрузка…</TableCell>
          </TableRow>
        ) : items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="py-10 text-center text-slate-500">
              Запросов не найдено
            </TableCell>
          </TableRow>
        ) : (
          items.map((item) => (
            <TableRow key={item.id} className={selectedIds.has(item.id) ? "bg-blue-50" : undefined}>
              <TableCell>
                <input
                  type="checkbox"
                  aria-label={`Выбрать заявку ${item.name}`}
                  checked={selectedIds.has(item.id)}
                  onChange={(event) => onToggle(item.id, event.target.checked)}
                />
              </TableCell>
              <TableCell className="whitespace-nowrap">{formatDate(item.createdAt)}</TableCell>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell>
                <div>{item.phone}</div>
                <div className="text-xs text-slate-500">{item.email || "—"}</div>
              </TableCell>
              <TableCell>
                <Badge className={applicationStatusBadgeClass[item.status]}>
                  {applicationStatusLabels[item.status]}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Открыть заявку"
                    onClick={() => onOpen(item.id)}
                  >
                    <Eye size={17} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:bg-red-50"
                    disabled={deletingId === item.id}
                    onClick={() => onDelete(item)}
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
  );
}
