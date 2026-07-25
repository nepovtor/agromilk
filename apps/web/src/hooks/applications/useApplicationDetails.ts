import { useCallback, useEffect, useState } from "react";
import type { ApplicationRecord } from "@agromilk/shared";
import { api } from "@/api";
import { applicationErrorMessage } from "./errorMessage";

type ApplicationDetailsOptions = {
  applicationId?: string;
  navigate: (path: string) => void;
  replaceInList: (item: ApplicationRecord) => void;
  setError: (error: string) => void;
};

export function useApplicationDetails({
  applicationId,
  navigate,
  replaceInList,
  setError,
}: ApplicationDetailsOptions) {
  const [selected, setSelected] = useState<ApplicationRecord | null>(null);

  useEffect(() => {
    if (!applicationId) return;
    const controller = new AbortController();
    api.applications
      .get(applicationId, controller.signal)
      .then((item) => {
        if (controller.signal.aborted) return;
        setSelected(item);
        replaceInList(item);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setError(applicationErrorMessage(cause, "Не удалось загрузить заявку"));
      });
    return () => controller.abort();
  }, [applicationId, replaceInList, setError]);

  const open = useCallback((id: string) => navigate(`/admin/applications/${id}`), [navigate]);
  const closeDetails = useCallback(() => {
    setSelected(null);
    navigate("/admin/applications");
  }, [navigate]);

  return { selected, setSelected, open, closeDetails };
}
