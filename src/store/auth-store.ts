"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUserPublic } from "@/types/auth";

export type AuthStoreState = {
  accessToken: string | null;
  /** Legacy; refresh lives in httpOnly cookie — keep null in browser. */
  refreshToken: string | null;
  user: AuthUserPublic | null;
  /** False until persist hydrate + optional silent refresh settle. */
  authBootstrapDone: boolean;
  /** Last in-app path for post-login redirect (not persisted across devices beyond this browser). */
  lastPath: string | null;
  setSession: (input: {
    accessToken: string;
    refreshToken?: string | null;
    user: AuthUserPublic | null;
  }) => void;
  setAccess: (accessToken: string) => void;
  setLastPath: (path: string | null) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      authBootstrapDone: false,
      lastPath: null,
      setSession: ({ accessToken, refreshToken, user }) =>
        set({
          accessToken,
          refreshToken: refreshToken ?? null,
          user,
        }),
      setAccess: (accessToken) => set({ accessToken }),
      setLastPath: (lastPath) => set({ lastPath }),
      clear: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          lastPath: null,
        }),
    }),
    {
      name: "planner-auth-v2",
      /** Never persist tokens — only stable profile + navigation hint. */
      partialize: (s) => ({
        user: s.user,
        lastPath: s.lastPath,
      }),
    }
  )
);
