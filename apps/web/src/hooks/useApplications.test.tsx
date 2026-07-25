import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useApplications } from "./useApplications";

const { getApplication, listApplications } = vi.hoisted(() => ({
  getApplication: vi.fn(),
  listApplications: vi.fn(),
}));

vi.mock("@/api", () => ({
  api: {
    applications: {
      get: getApplication,
      list: listApplications,
      update: vi.fn(),
      remove: vi.fn(),
      bulkUpdate: vi.fn(),
      exportCsv: vi.fn(),
    },
  },
}));

describe("useApplications", () => {
  beforeEach(() => {
    getApplication.mockReset();
    listApplications.mockResolvedValue({
      items: [],
      pagination: { page: 1, pageSize: 20, totalItems: 0, totalPages: 1 },
    });
  });

  it("loads details once after navigation", async () => {
    const navigate = vi.fn();
    const application = { id: "application-id" };
    getApplication.mockResolvedValue(application);
    const initialProps: { applicationId?: string } = {};
    const { result, rerender } = renderHook(
      ({ applicationId }: { applicationId?: string }) =>
        useApplications({ applicationId, navigate }),
      { initialProps },
    );

    act(() => result.current.open("application-id"));
    expect(navigate).toHaveBeenCalledWith("/admin/applications/application-id");
    expect(getApplication).not.toHaveBeenCalled();

    rerender({ applicationId: "application-id" });
    await waitFor(() => expect(getApplication).toHaveBeenCalledOnce());
  });
});
