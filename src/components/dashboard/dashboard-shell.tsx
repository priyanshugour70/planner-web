"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useAuthStore } from "@/store/auth-store";

const nav = [
  { href: "/dashboard", label: "Overview" },
  { href: "/goals", label: "Goals" },
  { href: "/tasks", label: "Tasks" },
  { href: "/finance", label: "Finance" },
  { href: "/habits", label: "Habits" },
  { href: "/journal", label: "Journal" },
  { href: "/notes", label: "Notes" },
  { href: "/calendar", label: "Calendar" },
] as const;

/** On SSR/prerender, `localStorage` may be missing — persist middleware skips `api.persist` entirely. */
function authPersistApi() {
  return useAuthStore.persist as
    | undefined
    | {
        hasHydrated: () => boolean;
        onFinishHydration: (fn: () => void) => () => void;
      };
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, signOut, loadProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  /** Start false: same server + client first paint; never touch `persist` in useState (can be undefined on SSR). */
  const [persistReady, setPersistReady] = useState(false);

  useEffect(() => {
    const p = authPersistApi();
    if (!p) {
      queueMicrotask(() => {
        setPersistReady(true);
      });
      return;
    }
    if (p.hasHydrated()) {
      queueMicrotask(() => {
        setPersistReady(true);
      });
      return;
    }
    const unsub = p.onFinishHydration(() => {
      queueMicrotask(() => {
        setPersistReady(true);
      });
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!persistReady) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    void loadProfile();
  }, [persistReady, isAuthenticated, loadProfile, router]);

  if (!persistReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-zinc-600 dark:bg-black dark:text-zinc-400">
        Restoring session…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 text-zinc-600 dark:bg-black dark:text-zinc-400">
        Redirecting to sign in…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-100 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <aside className="flex w-56 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-4 py-5 dark:border-zinc-800">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            Planner
          </Link>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">End-to-end life OS</p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-2">
          {nav.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-zinc-200 p-2 dark:border-zinc-800">
          <Link
            href="/"
            className="mb-1 block rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Home
          </Link>
          <button
            type="button"
            onClick={() => void signOut()}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
