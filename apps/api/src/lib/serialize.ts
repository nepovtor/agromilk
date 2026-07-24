export function serializeDates<T extends Record<string, unknown>>(record: T): T {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value])
  ) as T;
}
