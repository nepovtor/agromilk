import { useCallback, useState } from "react";
import type { ApplicationRecord, UpdateApplicationInput } from "@agromilk/shared";
import { api } from "@/api";
import { applicationErrorMessage } from "./errorMessage";

type ApplicationMutationsOptions = {
  selected: ApplicationRecord | null;
  setSelected: (item: ApplicationRecord | null) => void;
  navigate: (path: string) => void;
  replaceInList: (item: ApplicationRecord) => void;
  load: () => Promise<void>;
  setError: (error: string) => void;
};

export function useApplicationMutations({
  selected,
  setSelected,
  navigate,
  replaceInList,
  load,
  setError,
}: ApplicationMutationsOptions) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const update = useCallback(
    async (id: string, changes: UpdateApplicationInput) => {
      const item = await api.applications.update(id, changes);
      setSelected(item);
      replaceInList(item);
      return item;
    },
    [replaceInList, setSelected],
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
        setError(applicationErrorMessage(cause, "Не удалось удалить заявку"));
      } finally {
        setDeletingId(null);
      }
    },
    [load, setError],
  );
  const deleteSelected = useCallback(async () => {
    if (!selected) return;
    await api.applications.remove(selected.id);
    setSelected(null);
    navigate("/admin/applications");
    await load();
  }, [load, navigate, selected, setSelected]);

  return { deletingId, update, remove, deleteSelected };
}
