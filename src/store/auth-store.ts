"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUserPublic } from "@/types/auth";

export type AuthStoreState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUserPublic | null;
  setSession: (input: {
    accessToken: string;
    refreshToken: string;
    user: AuthUserPublic | null;
  }) => void;
  setAccess: (accessToken: string) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: ({ accessToken, refreshToken, user }) =>
        set({ accessToken, refreshToken, user }),
      setAccess: (accessToken) => set({ accessToken }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    {
      name: "planner-auth",
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        user: s.user,
      }),
    }
  )
);
