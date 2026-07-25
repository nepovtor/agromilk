import { useCallback, useEffect, useRef } from "react";
import { useApplicationDetails } from "./applications/useApplicationDetails";
import { useApplicationExport } from "./applications/useApplicationExport";
import { useApplicationFilters } from "./applications/useApplicationFilters";
import { useApplicationList } from "./applications/useApplicationList";
import { useApplicationMutations } from "./applications/useApplicationMutations";
import { useApplicationSelection } from "./applications/useApplicationSelection";

type UseApplicationsOptions = {
  applicationId?: string;
  navigate: (path: string) => void;
};

export function useApplications({ applicationId, navigate }: UseApplicationsOptions) {
  const filters = useApplicationFilters();
  const clearSelectionRef = useRef<() => void>(() => undefined);
  const clearSelection = useCallback(() => clearSelectionRef.current(), []);
  const list = useApplicationList(filters.queryFor, clearSelection);
  const details = useApplicationDetails({
    applicationId,
    navigate,
    replaceInList: list.replaceInList,
    setError: list.setError,
  });
  const selection = useApplicationSelection({
    items: list.data?.items ?? [],
    load: list.load,
    setError: list.setError,
  });
  useEffect(() => {
    clearSelectionRef.current = selection.clearSelection;
  }, [selection.clearSelection]);
  const mutations = useApplicationMutations({
    selected: details.selected,
    setSelected: details.setSelected,
    navigate,
    replaceInList: list.replaceInList,
    load: list.load,
    setError: list.setError,
  });
  const applicationExport = useApplicationExport(filters.queryFor, list.setError);

  return {
    data: list.data,
    error: list.error,
    loading: list.loading,
    ...filters,
    selected: details.selected,
    selectedIds: selection.selectedIds,
    bulkStatus: selection.bulkStatus,
    bulkSaving: selection.bulkSaving,
    exporting: applicationExport.exporting,
    deletingId: mutations.deletingId,
    setBulkStatus: selection.setBulkStatus,
    clearSelection: selection.clearSelection,
    toggleSelection: selection.toggleSelection,
    toggleVisibleSelection: selection.toggleVisibleSelection,
    open: details.open,
    update: mutations.update,
    remove: mutations.remove,
    deleteSelected: mutations.deleteSelected,
    applyBulkStatus: selection.applyBulkStatus,
    exportCsv: applicationExport.exportCsv,
    closeDetails: details.closeDetails,
  };
}
