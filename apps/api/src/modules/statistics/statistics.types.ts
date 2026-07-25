import type { StatisticsRangeQuery } from "@agromilk/shared";

export type StatisticsQuery = StatisticsRangeQuery;
export type StatisticsRange = {
  from: Date;
  toExclusive: Date;
  fromDate: string;
  toDate: string;
};
