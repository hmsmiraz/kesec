import { ApiError, type Secret, type SecretInput, type User } from "./types";

// Deliberately using ?? here, not ||: an empty string is a valid, intentional
// value (same-origin relative API calls, e.g. behind a reverse proxy), and
// || would incorrectly treat "" as unset and fall back to localhost.
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const TOKEN_KEY = "kesec_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let detail = `Request failed with status ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      // response had no JSON body - keep the generic message
    }
    throw new ApiError(res.status, detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  register: (email: string, password: string) =>
    request<User>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  login: async (email: string, password: string) => {
    const result = await request<{ access_token: string }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setToken(result.access_token);
    return result;
  },

  logout: async () => {
    try {
      await request<void>("/api/auth/logout", { method: "POST" });
    } finally {
      clearToken();
    }
  },

  me: () => request<User>("/api/auth/me"),

  getSecrets: () => request<Secret[]>("/api/secrets"),

  addSecret: (data: SecretInput) =>
    request<Secret>("/api/secrets", { method: "POST", body: JSON.stringify(data) }),

  updateSecret: (id: number, data: Partial<SecretInput>) =>
    request<Secret>(`/api/secrets/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  deleteSecret: (id: number) => request<void>(`/api/secrets/${id}`, { method: "DELETE" }),
};
