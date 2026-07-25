import { describe, expect, it } from "vitest";
import { getBusinessDateRange } from "./business-date-range.js";

describe("getBusinessDateRange", () => {
  it("converts Minsk calendar boundaries to UTC around midnight", () => {
    const range = getBusinessDateRange({ from: "2026-07-25", to: "2026-07-25" });
    expect(range.from.toISOString()).toBe("2026-07-24T21:00:00.000Z");
    expect(range.toExclusive.toISOString()).toBe("2026-07-25T21:00:00.000Z");
  });
});
