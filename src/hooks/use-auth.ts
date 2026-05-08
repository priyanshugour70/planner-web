"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import * as AuthApi from "@/services/auth.service";
import { useAuthStore } from "@/store/auth-store";
import type { AuthSessionPayload } from "@/types/auth";

function isAuthPayload(
  data: AuthSessionPayload | { ok: true; message: string }
): data is AuthSessionPayload {
  return "accessToken" in data && "refreshToken" in data;
}

export function useAuth() {
  const router = useRouter();
  const { accessToken, user, setSession, clear } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = useMemo(() => Boolean(accessToken && user), [accessToken, user]);

  const applySession = useCallback(
    (payload: AuthSessionPayload) => {
      setSession({
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
        user: payload.user,
      });
    },
    [setSession]
  );

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await AuthApi.login({ email, password });
        if (!res.success || !res.data) {
          setError(res.message || "Login failed");
          return false;
        }
        applySession(res.data);
        router.push("/dashboard");
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Login failed");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [applySession, router]
  );

  const register = useCallback(
    async (input: { username: string; email: string; password: string; fullName?: string }) => {
      setLoading(true);
      setError(null);
      try {
        const res = await AuthApi.signup(input);
        if (!res.success || !res.data) {
          setError(res.message || "Signup failed");
          return false;
        }
        applySession(res.data);
        router.push("/dashboard");
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Signup failed");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [applySession, router]
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      const rt = useAuthStore.getState().refreshToken;
      await AuthApi.logout(rt ? { refreshToken: rt } : {});
    } catch {
      /* ignore */
    } finally {
      clear();
      setLoading(false);
      router.push("/login");
    }
  }, [clear, router]);

  const loadProfile = useCallback(async () => {
    const res = await AuthApi.fetchMe();
    if (!res.success || !res.data) return;
    const d = res.data;
    setSession({
      accessToken: useAuthStore.getState().accessToken!,
      refreshToken: useAuthStore.getState().refreshToken!,
      user: {
        id: d.id,
        username: d.username,
        email: d.email,
        emailVerified: d.emailVerified,
        accountStatus: d.accountStatus,
      },
    });
  }, [setSession]);

  return {
    user,
    loading,
    error,
    isAuthenticated,
    signInWithPassword,
    register,
    signOut,
    loadProfile,
    applySession,
    isAuthPayload,
  };
}
