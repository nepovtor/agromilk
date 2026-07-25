const VISITOR_STORAGE_KEY = "visitor_id";
const SESSION_STORAGE_KEY = "session_id";

function getOrCreateId(key: string, storage: Storage) {
  const existing = storage.getItem(key);
  if (existing) return existing;
  const created = crypto.randomUUID();
  storage.setItem(key, created);
  return created;
}

export function getVisitorId() {
  return getOrCreateId(VISITOR_STORAGE_KEY, window.localStorage);
}

export function getSessionId() {
  return getOrCreateId(SESSION_STORAGE_KEY, window.sessionStorage);
}
