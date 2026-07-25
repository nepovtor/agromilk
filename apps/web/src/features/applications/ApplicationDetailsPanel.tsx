import { useEffect, useState } from "react";
import type {
  ApplicationRecord,
  ApplicationStatus,
  UpdateApplicationInput,
} from "@agromilk/shared";
import { Trash2, X } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils";
import { applicationStatusLabels } from "./application-status";

type ApplicationDetailsPanelProps = {
  item: ApplicationRecord;
  onClose: () => void;
  onSave: (data: UpdateApplicationInput) => Promise<ApplicationRecord>;
  onDelete: () => Promise<void>;
};

export function ApplicationDetailsPanel({
  item,
  onClose,
  onSave,
  onDelete,
}: ApplicationDetailsPanelProps) {
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

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await onSave({ status, adminComment: comment });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось сохранить заявку");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm("Удалить заявку без возможности восстановления?")) return;
    setDeleting(true);
    setError("");
    try {
      await onDelete();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось удалить заявку");
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/35" onClick={onClose} role="presentation">
      <aside
        className="ml-auto h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
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
              onChange={(event) => setStatus(event.target.value as ApplicationStatus)}
            >
              {Object.entries(applicationStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-medium">Рабочая заметка агронома</span>
            <Textarea value={comment} onChange={(event) => setComment(event.target.value)} />
          </label>
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {error}
            </p>
          )}
          <Button className="w-full" disabled={saving || deleting} onClick={() => void save()}>
            {saving ? "Сохранение…" : "Сохранить"}
          </Button>
          <Button
            variant="destructive"
            className="w-full"
            disabled={saving || deleting}
            onClick={() => void remove()}
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
