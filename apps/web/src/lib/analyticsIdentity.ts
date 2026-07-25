const VISITOR_STORAGE_KEY = "visitor_id";
const SESSION_STORAGE_KEY = "session_id";

export function safeRandomUUID() {
  try {
    return globalThis.crypto?.randomUUID?.();
  } catch {
    return undefined;
  }
}

function getOrCreateId(key: string, storage: () => Storage) {
  try {
    const target = storage();
    const existing = target.getItem(key);
    if (existing) return existing;
    const created = safeRandomUUID();
    if (!created) return undefined;
    target.setItem(key, created);
    return created;
  } catch {
    return undefined;
  }
}

export function getVisitorId() {
  return getOrCreateId(VISITOR_STORAGE_KEY, () => window.localStorage);
}

export function getSessionId() {
  return getOrCreateId(SESSION_STORAGE_KEY, () => window.sessionStorage);
}
