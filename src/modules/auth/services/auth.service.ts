"use client";

import { apiRequest } from "@/lib/client/http";
import type { AuthSessionPayload, MeResponse } from "@/types/auth";

export async function signup(payload: {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}) {
  return apiRequest<AuthSessionPayload>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function login(payload: { email: string; password: string; deviceId?: string }) {
  return apiRequest<AuthSessionPayload>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logout(payload?: { refreshToken?: string }) {
  return apiRequest<{ ok: true }>("/auth/logout", {
    method: "POST",
    body: JSON.stringify(payload ?? {}),
  });
}

export async function refresh() {
  return apiRequest<AuthSessionPayload>(
    "/auth/refresh",
    { method: "POST", body: JSON.stringify({}) },
    { skipAuth: true }
  );
}

export async function forgotPassword(email: string) {
  return apiRequest<{ ok: true; message: string; devOtp?: string }>(
    "/auth/forgot-password",
    { method: "POST", body: JSON.stringify({ email }) },
    { skipAuth: true }
  );
}

export async function resetPassword(payload: { email: string; code: string; newPassword: string }) {
  return apiRequest<{ ok: true; message: string }>(
    "/auth/reset-password",
    { method: "POST", body: JSON.stringify(payload) },
    { skipAuth: true }
  );
}

export async function sendOtp(payload: {
  email: string;
  purpose:
    | "login"
    | "email_verification"
    | "password_reset"
    | "phone_verification"
    | "two_factor";
}) {
  return apiRequest<{ ok: true; message: string; devOtp?: string }>(
    "/auth/send-otp",
    { method: "POST", body: JSON.stringify(payload) },
    { skipAuth: true }
  );
}

export async function verifyOtp(payload: {
  email: string;
  code: string;
  purpose:
    | "login"
    | "email_verification"
    | "password_reset"
    | "phone_verification"
    | "two_factor";
}) {
  return apiRequest<AuthSessionPayload | { ok: true; message: string }>(
    "/auth/verify-otp",
    { method: "POST", body: JSON.stringify(payload) },
    { skipAuth: true }
  );
}

export async function resendOtp(payload: Parameters<typeof sendOtp>[0]) {
  return apiRequest<{ ok: true; message: string; devOtp?: string }>(
    "/auth/resend-otp",
    { method: "POST", body: JSON.stringify(payload) },
    { skipAuth: true }
  );
}

export async function fetchMe() {
  return apiRequest<MeResponse>("/auth/me", { method: "GET" });
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}) {
  return apiRequest<{ ok: true; message: string }>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listSessions() {
  return apiRequest<{ sessions: unknown[] }>("/auth/sessions", { method: "GET" });
}

export async function revokeSession(sessionId: string) {
  return apiRequest<{ ok: true }>(`/auth/sessions/${sessionId}`, { method: "DELETE" });
}

export async function revokeOtherSessions() {
  return apiRequest<{ ok: true }>("/auth/sessions/revoke-others", { method: "POST" });
}
