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
    api.applications
      .get(applicationId)
      .then((item) => {
        setSelected(item);
        replaceInList(item);
      })
      .catch((cause: unknown) =>
        setError(applicationErrorMessage(cause, "Не удалось загрузить заявку")),
      );
  }, [applicationId, replaceInList, setError]);

  const open = useCallback((id: string) => navigate(`/admin/applications/${id}`), [navigate]);
  const closeDetails = useCallback(() => {
    setSelected(null);
    navigate("/admin/applications");
  }, [navigate]);

  return { selected, setSelected, open, closeDetails };
}
