import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrderSection } from "./OrderSection";
import { installTestStorage } from "@/test/setup";

const { createApplication } = vi.hoisted(() => ({ createApplication: vi.fn() }));

vi.mock("@/api", () => ({
  api: { applications: { create: createApplication } },
}));

describe("OrderSection", () => {
  beforeEach(() => {
    createApplication.mockReset();
    installTestStorage();
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
    if (!form) throw new Error("Order form was not rendered");
    fireEvent.submit(form);
    fireEvent.submit(form);

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

  it("submits when browser storage is unavailable", async () => {
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get: () => {
        throw new Error("Storage denied");
      },
    });
    createApplication.mockResolvedValue({ success: true, id: crypto.randomUUID() });
    const { container } = render(<OrderSection products={[]} request={null} />);
    fireEvent.change(screen.getByPlaceholderText("Ваше имя"), { target: { value: "Анна" } });
    fireEvent.change(screen.getByPlaceholderText("Ваш телефон"), {
      target: { value: "+375291112244" },
    });
    const form = container.querySelector("form");
    if (!form) throw new Error("Order form was not rendered");
    fireEvent.submit(form);

    await waitFor(() => expect(createApplication).toHaveBeenCalledOnce());
    expect(createApplication).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Анна", visitorId: undefined }),
    );
    expect(await screen.findByText(/Заявка принята/)).toBeInTheDocument();
  });
});
