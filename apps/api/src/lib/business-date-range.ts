import { env } from "../config/env.js";
import { ValidationError } from "./errors.js";

type DateRangeQuery = { from?: string; to?: string };

function dateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function localMidnightUtc(dateValue: string, timeZone: string) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const desired = Date.UTC(year, month - 1, day);
  let candidate = new Date(desired);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = dateParts(candidate, timeZone);
    const represented = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second),
    );
    candidate = new Date(candidate.getTime() + desired - represented);
  }
  return candidate;
}

export function addCalendarDays(dateValue: string, days: number) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function businessDate(date = new Date()) {
  const parts = dateParts(date, env.BUSINESS_TIME_ZONE);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getBusinessDateRange(query: DateRangeQuery, defaultDays = 29) {
  const toDate = query.to ?? businessDate();
  const fromDate = query.from ?? addCalendarDays(toDate, -defaultDays);
  if (fromDate > toDate)
    throw new ValidationError("Некорректный диапазон дат", {
      from: ["Начальная дата должна быть не позже конечной"],
    });
  const calendarDays = Math.round(
    (Date.parse(`${toDate}T00:00:00Z`) - Date.parse(`${fromDate}T00:00:00Z`)) / 86_400_000,
  );
  if (calendarDays > 366)
    throw new ValidationError("Диапазон дат не должен превышать 366 дней", {
      to: ["Диапазон дат не должен превышать 366 дней"],
    });
  return {
    from: localMidnightUtc(fromDate, env.BUSINESS_TIME_ZONE),
    toExclusive: localMidnightUtc(addCalendarDays(toDate, 1), env.BUSINESS_TIME_ZONE),
    fromDate,
    toDate,
  };
}
