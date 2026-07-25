import { useCallback, useState } from "react";
import { api } from "@/api";
import { applicationErrorMessage } from "./errorMessage";

type QueryFactory = (page?: number, pageSize?: number) => URLSearchParams;

export function useApplicationExport(queryFor: QueryFactory, setError: (error: string) => void) {
  const [exporting, setExporting] = useState(false);
  const exportCsv = useCallback(async () => {
    setExporting(true);
    setError("");
    try {
      const blob = await api.applications.exportCsv(queryFor(1, 100));
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `agromilk-applications-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (cause) {
      setError(applicationErrorMessage(cause, "Не удалось выгрузить заявки"));
    } finally {
      setExporting(false);
    }
  }, [queryFor, setError]);

  return { exporting, exportCsv };
}
