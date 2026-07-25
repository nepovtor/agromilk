import { useCallback, useState } from "react";
import type { ApplicationRecord, ApplicationStatus } from "@agromilk/shared";
import { api } from "@/api";
import { applicationErrorMessage } from "./errorMessage";

type ApplicationSelectionOptions = {
  items: ApplicationRecord[];
  load: () => Promise<void>;
  setError: (error: string) => void;
};

export function useApplicationSelection({
  items,
  load,
  setError,
}: ApplicationSelectionOptions) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<ApplicationStatus>("in_progress");
  const [bulkSaving, setBulkSaving] = useState(false);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);
  const applyBulkStatus = useCallback(async () => {
    if (!selectedIds.size) return;
    setBulkSaving(true);
    setError("");
    try {
      await api.applications.bulkUpdate([...selectedIds], bulkStatus);
      await load();
    } catch (cause) {
      setError(applicationErrorMessage(cause, "Не удалось изменить заявки"));
    } finally {
      setBulkSaving(false);
    }
  }, [bulkStatus, load, selectedIds, setError]);

  return {
    selectedIds,
    bulkStatus,
    bulkSaving,
    setBulkStatus,
    clearSelection,
    applyBulkStatus,
    toggleSelection: (id: string, selected: boolean) =>
      setSelectedIds((current) => {
        const next = new Set(current);
        if (selected) next.add(id);
        else next.delete(id);
        return next;
      }),
    toggleVisibleSelection: (selected: boolean) =>
      setSelectedIds((current) => {
        const next = new Set(current);
        items.forEach((item) => {
          if (selected) next.add(item.id);
          else next.delete(item.id);
        });
        return next;
      }),
  };
}
