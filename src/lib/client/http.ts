"use client";

import type { APIEnvelope } from "@/types/api-response";
import { useAuthStore } from "@/store/auth-store";

async function tryRefresh(): Promise<boolean> {
  const res = await fetch("/api/v1/auth/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-request-id": crypto.randomUUID(),
    },
    body: "{}",
    credentials: "include",
  });
  const body = (await res.json()) as APIEnvelope<{
    accessToken: string;
    user?: import("@/types/auth").AuthUserPublic;
  }>;
  if (!body.success || !body.data?.accessToken) return false;
  useAuthStore.getState().setSession({
    accessToken: body.data.accessToken,
    user: body.data.user ?? useAuthStore.getState().user,
  });
  return true;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  opts?: { skipAuth?: boolean; _retried?: boolean }
): Promise<APIEnvelope<T>> {
  const headers = new Headers(init.headers);
  if (!opts?.skipAuth) {
    const token = useAuthStore.getState().accessToken;
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("x-request-id")) {
    headers.set("x-request-id", crypto.randomUUID());
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  let res: Response;
  try {
    res = await fetch(`/api/v1${path}`, {
      ...init,
      headers,
      credentials: "include",
      signal: init.signal ?? controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  let json: APIEnvelope<T>;
  try {
    json = (await res.json()) as APIEnvelope<T>;
  } catch {
    json = {
      success: false,
      message: "Invalid response",
      error: { code: "INVALID_RESPONSE", details: {} },
      timestamp: new Date().toISOString(),
      requestId: "",
    } as APIEnvelope<T>;
  }

  if (res.status === 401 && !opts?._retried && !opts?.skipAuth) {
    const refreshed = await tryRefresh();
    if (refreshed) return apiRequest<T>(path, init, { ...opts, _retried: true });
  }

  return json;
}
