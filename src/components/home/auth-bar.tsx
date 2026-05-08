"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

/** Same tree on server + first client paint; avoids mismatch (persisted session only exists on client). */
export function AuthBar() {
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated, signOut } = useAuth();

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
    });
  }, []);

  if (!mounted) {
    return (
      <div
        className="flex h-9 min-w-[220px] items-center justify-end gap-3"
        aria-busy="true"
        aria-label="Account"
      >
        <span className="h-4 w-14 rounded bg-zinc-200 dark:bg-zinc-800" />
        <span className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
        <span className="h-4 w-16 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-wrap gap-3 text-sm font-medium">
        <a className="text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50" href="/login">
          Sign in
        </a>
        <a className="text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50" href="/signup">
          Sign up
        </a>
        <a className="text-zinc-600 hover:underline dark:text-zinc-400" href="/api-docs">
          API docs
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 text-sm text-zinc-700 dark:text-zinc-300 sm:flex-row sm:items-center sm:justify-between">
      <span>
        Signed in as <span className="font-semibold text-zinc-900 dark:text-zinc-50">{user?.email}</span>
      </span>
      <div className="flex flex-wrap gap-3 font-medium">
        <a className="text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50" href="/dashboard">
          Dashboard
        </a>
        <button
          type="button"
          className="text-left text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50"
          onClick={() => void signOut()}
        >
          Sign out
        </button>
        <a className="text-zinc-600 hover:underline dark:text-zinc-400" href="/api-docs">
          API docs
        </a>
      </div>
    </div>
  );
}
