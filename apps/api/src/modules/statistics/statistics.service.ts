import { addCalendarDays, getBusinessDateRange } from "../../lib/business-date-range.js";
import { ConversionInvariantError } from "../../lib/errors.js";
import { StatisticsRepository } from "./statistics.repository.js";
import type { StatisticsQuery } from "./statistics.types.js";

export class StatisticsService {
  constructor(
    private readonly repository = new StatisticsRepository(),
    private readonly logger: Pick<Console, "error"> = console,
  ) {}

  async summary(query: StatisticsQuery) {
    const result = await this.repository.summary(getBusinessDateRange(query));
    if (result.convertedVisitors > result.visitors) {
      const error = new ConversionInvariantError(result.visitors, result.convertedVisitors);
      this.logger.error(error);
      throw error;
    }
    const rawRate = result.visitors === 0 ? 0 : (result.convertedVisitors / result.visitors) * 100;
    return {
      visitors: result.visitors,
      pageViews: result.pageViews,
      applications: result.applications,
      conversionRate: Number(rawRate.toFixed(2)),
    };
  }

  async timeline(query: StatisticsQuery) {
    const range = getBusinessDateRange(query);
    const [events, applicationRows] = await this.repository.timeline(range);
    const map = new Map<
      string,
      { date: string; visitors: number; pageViews: number; applications: number }
    >();
    for (const row of events)
      map.set(row.date, {
        date: row.date,
        visitors: Number(row.visitors),
        pageViews: Number(row.pageViews),
        applications: 0,
      });
    for (const row of applicationRows) {
      const item = map.get(row.date) ?? {
        date: row.date,
        visitors: 0,
        pageViews: 0,
        applications: 0,
      };
      item.applications = Number(row.applications);
      map.set(row.date, item);
    }
    for (let date = range.fromDate; date <= range.toDate; date = addCalendarDays(date, 1))
      if (!map.has(date)) map.set(date, { date, visitors: 0, pageViews: 0, applications: 0 });
    return { items: [...map.values()].sort((a, b) => a.date.localeCompare(b.date)) };
  }
}
