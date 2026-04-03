export interface ApiResult<T> {
  data: T;
  source: "api" | "mock";
}

export const API_BASE_URL =
  (import.meta as ImportMeta & { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL ??
  "";

export function buildApiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

export async function requestJson<T>(path: string, init?: RequestInit) {
  const response = await fetch(buildApiUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}
