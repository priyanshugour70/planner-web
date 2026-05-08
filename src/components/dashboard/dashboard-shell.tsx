"use client";

import { MenuIcon } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { useAuthStore } from "@/store/auth-store";
import { cn } from "@/lib/utils";

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

type PersistApi = {
  hasHydrated: () => boolean;
  onFinishHydration: (fn: () => void) => () => void;
};

/** On SSR/prerender, `localStorage` may be missing — persist middleware skips `api.persist` entirely. */
function authPersistApi(): PersistApi | undefined {
  const p = (useAuthStore as unknown as { persist?: PersistApi }).persist;
  return p;
}

function NavLinks({
  pathname,
  onNavigate,
  className,
}: {
  pathname: string | null;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <nav className={cn("flex flex-col gap-0.5 p-2", className)}>
      {nav.map((item) => {
        const active =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname === item.href || pathname?.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              buttonVariants({ variant: active ? "secondary" : "ghost", size: "default" }),
              "w-full justify-start font-medium"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ onNavigate }: { onNavigate?: () => void }) {
  const { signOut } = useAuth();
  return (
    <div className="border-t p-2">
      <Link
        href="/"
        onClick={onNavigate}
        className={cn(
          buttonVariants({ variant: "ghost", size: "default" }),
          "mb-1 w-full justify-start text-muted-foreground"
        )}
      >
        Home
      </Link>
      <Button
        type="button"
        variant="ghost"
        className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => {
          onNavigate?.();
          void signOut();
        }}
      >
        Sign out
      </Button>
    </div>
  );
}

function BrandBlock() {
  return (
    <div className="border-b px-4 py-5">
      <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
        Planner
      </Link>
      <p className="mt-1 text-xs text-muted-foreground">End-to-end life OS</p>
    </div>
  );
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loadProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [persistReady, setPersistReady] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

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
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4">
        <Skeleton className="h-8 w-48" />
        <p className="text-sm text-muted-foreground">Restoring session…</p>
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

  const closeMobile = () => setMobileNavOpen(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden min-h-screen w-56 shrink-0 flex-col border-r bg-card md:flex">
        <BrandBlock />
        <ScrollArea className="min-h-0 flex-1">
          <NavLinks pathname={pathname} />
        </ScrollArea>
        <SidebarFooter />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
          <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
            <SheetTrigger
              type="button"
              aria-label="Open menu"
              className={cn(buttonVariants({ variant: "outline", size: "icon" }))}
            >
              <MenuIcon className="size-5" />
            </SheetTrigger>
            <SheetContent side="left" className="flex w-[min(100%,20rem)] flex-col gap-0 p-0">
              <SheetHeader className="border-b px-4 py-4 text-left">
                <SheetTitle className="font-semibold">Planner</SheetTitle>
              </SheetHeader>
              <ScrollArea className="min-h-0 flex-1">
                <NavLinks pathname={pathname} onNavigate={closeMobile} className="pt-2" />
              </ScrollArea>
              <Separator />
              <SidebarFooter onNavigate={closeMobile} />
            </SheetContent>
          </Sheet>
          <span className="truncate text-sm font-medium">Menu</span>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
