"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/modules/auth/stores/auth-store";

function authPersistApi() {
  return useAuthStore.persist as
    | undefined
    | {
        hasHydrated: () => boolean;
        onFinishHydration: (fn: () => void) => () => void;
      };
}

async function silentRefreshFromCookie(): Promise<void> {
  const res = await fetch("/api/v1/auth/refresh", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-request-id": crypto.randomUUID(),
    },
    body: "{}",
    credentials: "include",
  });
  let json: {
    success?: boolean;
    data?: { accessToken?: string; user?: import("@/types/auth").AuthUserPublic };
  };
  try {
    json = (await res.json()) as typeof json;
  } catch {
    json = {};
  }
  if (json.success && json.data?.accessToken && json.data.user) {
    useAuthStore.getState().setSession({
      accessToken: json.data.accessToken,
      user: json.data.user,
    });
  } else if (useAuthStore.getState().user) {
    useAuthStore.getState().clear();
  }
}

/**
 * Restores access token from httpOnly refresh cookie after Zustand rehydration.
 * Runs once per full page load; must wrap the whole app so `/` AuthBar stays correct.
 */
export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const finish = () => {
      useAuthStore.setState({ authBootstrapDone: true });
    };

    const run = () => {
      void (async () => {
        try {
          if (useAuthStore.getState().accessToken) {
            finish();
            return;
          }
          await silentRefreshFromCookie();
        } finally {
          finish();
        }
      })();
    };

    const p = authPersistApi();
    if (!p) {
      queueMicrotask(run);
      return;
    }
    if (p.hasHydrated()) {
      queueMicrotask(run);
      return;
    }
    const unsub = p.onFinishHydration(() => {
      unsub();
      queueMicrotask(run);
    });
    return unsub;
  }, []);

  return <>{children}</>;
}
