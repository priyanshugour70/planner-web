"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronDownIcon } from "lucide-react";
import { ModuleLauncher } from "@/components/nav/module-launcher";
import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { moduleTitleFromPath } from "@/lib/nav/modules";
import { PRODUCT_NAME } from "@/lib/product";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";

type PersistApi = {
  hasHydrated: () => boolean;
  onFinishHydration: (fn: () => void) => () => void;
};

function authPersistApi(): PersistApi | undefined {
  const p = (useAuthStore as unknown as { persist?: PersistApi }).persist;
  return p;
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loadProfile, authBootstrapDone, signOut } = useAuth();
  const { user, setLastPath } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [persistReady, setPersistReady] = useState(false);

  useEffect(() => {
    const p = authPersistApi();
    if (!p) {
      queueMicrotask(() => setPersistReady(true));
      return;
    }
    if (p.hasHydrated()) {
      queueMicrotask(() => setPersistReady(true));
      return;
    }
    const unsub = p.onFinishHydration(() => {
      queueMicrotask(() => setPersistReady(true));
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (pathname) setLastPath(pathname);
  }, [pathname, setLastPath]);

  useEffect(() => {
    if (!persistReady || !authBootstrapDone) return;
    if (!isAuthenticated) {
      const next = `${pathname}${typeof window !== "undefined" ? window.location.search : ""}`;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }
    void loadProfile();
  }, [persistReady, authBootstrapDone, isAuthenticated, loadProfile, pathname, router]);

  if (!persistReady || !authBootstrapDone) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4">
        <Skeleton className="h-8 w-48" />
        <p className="text-sm text-muted-foreground">Preparing workspace…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4">
        <Skeleton className="h-8 w-40" />
        <p className="text-sm text-muted-foreground">Redirecting to sign in…</p>
      </div>
    );
  }

  const title = moduleTitleFromPath(pathname);

  return (
    <div className="relative flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-baseline gap-3">
            <Link
              href="/dashboard"
              className="shrink-0 text-sm font-semibold tracking-tight"
              aria-label={`${PRODUCT_NAME} — overview`}
            >
              {PRODUCT_NAME}
            </Link>
            <span className="hidden text-muted-foreground sm:inline">/</span>
            <h1 className="truncate text-sm font-medium text-muted-foreground sm:text-base">{title}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href="/" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "hidden sm:inline-flex")}>
              Home
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "max-w-[12rem] gap-1 font-normal"
                )}
              >
                <span className="truncate">{user?.email}</span>
                <ChevronDownIcon className="size-4 opacity-60" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-56" sideOffset={6}>
                <DropdownMenuItem onClick={() => router.push("/dashboard")}>Overview</DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/finance")}>Finance</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={() => void signOut()}>
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="flex-1 pb-24 pt-2 sm:pb-28">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
      </main>

      <ModuleLauncher />
    </div>
  );
}
