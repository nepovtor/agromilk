import { useCallback, useEffect, useState } from "react";
import type { ApplicationRecord, Paginated } from "@agromilk/shared";
import { api } from "@/api";
import { applicationErrorMessage } from "./errorMessage";

type QueryFactory = (page?: number, pageSize?: number) => URLSearchParams;

export function useApplicationList(queryFor: QueryFactory, onLoaded: () => void) {
  const [data, setData] = useState<Paginated<ApplicationRecord> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const replaceInList = useCallback((item: ApplicationRecord) => {
    setData((current) =>
      current
        ? { ...current, items: current.items.map((entry) => (entry.id === item.id ? item : entry)) }
        : current,
    );
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api.applications.list(queryFor()));
      onLoaded();
      setError("");
    } catch (cause) {
      setError(applicationErrorMessage(cause, "Не удалось загрузить заявки"));
    } finally {
      setLoading(false);
    }
  }, [onLoaded, queryFor]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  return { data, loading, error, setError, load, replaceInList };
}
