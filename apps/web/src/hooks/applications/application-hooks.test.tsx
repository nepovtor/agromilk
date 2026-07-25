import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useApplicationFilters } from "./useApplicationFilters";
import { useApplicationSelection } from "./useApplicationSelection";
import { useApplicationMutations } from "./useApplicationMutations";

const { bulkUpdate, remove, update } = vi.hoisted(() => ({
  bulkUpdate: vi.fn(),
  remove: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/api", () => ({ api: { applications: { bulkUpdate, remove, update } } }));

const item = {
  id: "application-1",
  name: "Farmer",
  phone: "+375291112233",
  email: null,
  message: "",
  status: "new" as const,
  visitorId: null,
  sourcePage: null,
  utmSource: null,
  utmMedium: null,
  utmCampaign: null,
  adminComment: "",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("application hooks", () => {
  it("builds, applies and resets list filters", () => {
    const { result } = renderHook(useApplicationFilters);
    act(() => {
      result.current.setSearchInput(" farm ");
    });
    act(() => {
      result.current.submitSearch();
      result.current.setStatus("in_progress");
      result.current.setFrom("2026-01-01");
      result.current.setTo("2026-01-31");
      result.current.setSort("asc");
    });
    expect(result.current.queryFor().toString()).toContain("search=farm");
    expect(result.current.queryFor().toString()).toContain("status=in_progress");
    expect(result.current.hasActiveFilters).toBe(true);
    act(() => result.current.resetFilters());
    expect(result.current.queryFor().toString()).toBe("page=1&pageSize=20&sort=asc");
  });

  it("updates selected application and handles bulk selection", async () => {
    bulkUpdate.mockResolvedValue({ success: true, updated: 1 });
    const load = vi.fn().mockResolvedValue(undefined);
    const setError = vi.fn();
    const { result } = renderHook(() => useApplicationSelection({ items: [item], load, setError }));
    act(() => result.current.toggleSelection(item.id, true));
    act(() => result.current.setBulkStatus("completed"));
    await act(async () => result.current.applyBulkStatus());
    expect(bulkUpdate).toHaveBeenCalledWith([item.id], "completed");
    expect(load).toHaveBeenCalledOnce();
    act(() => result.current.toggleVisibleSelection(false));
    expect(result.current.selectedIds.size).toBe(0);
  });

  it("updates and removes applications through user-confirmed mutations", async () => {
    update.mockResolvedValue({ ...item, status: "completed" });
    remove.mockResolvedValue({ success: true });
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true),
    );
    const setSelected = vi.fn();
    const replaceInList = vi.fn();
    const load = vi.fn().mockResolvedValue(undefined);
    const setError = vi.fn();
    const navigate = vi.fn();
    const { result } = renderHook(() =>
      useApplicationMutations({
        selected: item,
        setSelected,
        replaceInList,
        load,
        setError,
        navigate,
      }),
    );
    await act(async () => result.current.update(item.id, { status: "completed" }));
    expect(replaceInList).toHaveBeenCalledWith(expect.objectContaining({ status: "completed" }));
    await act(async () => result.current.remove(item));
    await waitFor(() => expect(load).toHaveBeenCalledOnce());
    await act(async () => result.current.deleteSelected());
    expect(navigate).toHaveBeenCalledWith("/admin/applications");
  });
});
