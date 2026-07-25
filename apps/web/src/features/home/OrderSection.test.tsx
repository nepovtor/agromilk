import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrderSection } from "./OrderSection";

const { createApplication } = vi.hoisted(() => ({ createApplication: vi.fn() }));

vi.mock("@/api", () => ({
  api: { applications: { create: createApplication } },
}));

describe("OrderSection", () => {
  beforeEach(() => {
    createApplication.mockReset();
    localStorage.clear();
  });

  it("sends only one request for two immediate submit events", async () => {
    let resolveRequest!: (value: { success: true; id: string }) => void;
    createApplication.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );
    const { container } = render(<OrderSection products={[]} request={null} />);
    fireEvent.change(screen.getByPlaceholderText("Ваше имя"), { target: { value: "Иван" } });
    fireEvent.change(screen.getByPlaceholderText("Ваш телефон"), {
      target: { value: "+375291112233" },
    });
    const form = container.querySelector("form");
    expect(form).not.toBeNull();
    fireEvent.submit(form!);
    fireEvent.submit(form!);

    await waitFor(() => expect(createApplication).toHaveBeenCalledTimes(1));
    expect(createApplication).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Иван",
        submissionId: expect.any(String),
        visitorId: expect.any(String),
      }),
    );
    resolveRequest({ success: true, id: crypto.randomUUID() });
    expect(await screen.findByText(/Заявка принята/)).toBeInTheDocument();
  });
});
