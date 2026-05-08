"use client";

import { useAuth } from "@/hooks/use-auth";

export function AuthBar() {
  const { user, isAuthenticated, signOut } = useAuth();

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
