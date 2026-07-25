import { describe, expect, it, vi } from "vitest";
import { StatisticsService } from "./statistics.service.js";

function repositoryWith(summary: {
  visitors: number;
  pageViews: number;
  applications: number;
  convertedVisitors: number;
}) {
  return {
    summary: vi.fn().mockResolvedValue(summary),
    timeline: vi.fn().mockResolvedValue([[], []]),
  };
}

describe("StatisticsService", () => {
  it("excludes applications without a page-view cohort", async () => {
    const repository = repositoryWith({
      visitors: 1,
      pageViews: 1,
      applications: 1,
      convertedVisitors: 0,
    });
    const result = await new StatisticsService(repository).summary({
      from: "2026-07-25",
      to: "2026-07-25",
    });
    expect(result.conversionRate).toBe(0);
  });

  it("reports an impossible conversion invariant instead of hiding it", async () => {
    const repository = repositoryWith({
      visitors: 1,
      pageViews: 2,
      applications: 3,
      convertedVisitors: 2,
    });
    const logger = { error: vi.fn() };
    await expect(
      new StatisticsService(repository, logger).summary({ from: "2026-07-25", to: "2026-07-25" }),
    ).rejects.toThrow("Количество сконвертированных посетителей");
    expect(logger.error).toHaveBeenCalledOnce();
  });
});
