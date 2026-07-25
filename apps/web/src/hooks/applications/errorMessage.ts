export function applicationErrorMessage(cause: unknown, fallback: string) {
  return cause instanceof Error ? cause.message : fallback;
}
