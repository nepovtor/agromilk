const configuredApiBaseUrl: unknown = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL = (typeof configuredApiBaseUrl === "string" ? configuredApiBaseUrl : "").replace(
  /\/$/,
  "",
);

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public payload?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isForm = options.body instanceof FormData;
  const hasBody = options.body !== undefined && options.body !== null;
  const response = await fetch(`${API_BASE_URL}/api/v1${path}`, {
    credentials: "include",
    ...options,
    headers:
      isForm || !hasBody
        ? options.headers
        : { "Content-Type": "application/json", ...options.headers },
  });
  const payload: unknown = response.status === 204 ? null : await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      window.dispatchEvent(new Event("admin-session-expired"));
    }
    throw new ApiError(
      response.status,
      (payload as { message?: string } | null)?.message || "Ошибка запроса",
      payload,
    );
  }

  return payload as T;
}
