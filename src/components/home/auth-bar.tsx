"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { ChevronDownIcon } from "lucide-react";

export function AuthBar() {
  const [mounted, setMounted] = useState(false);
  const { user, isAuthenticated, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    queueMicrotask(() => {
      setMounted(true);
    });
  }, []);

  if (!mounted) {
    return (
      <div className="flex h-9 min-w-[200px] items-center justify-end gap-2" aria-busy="true" aria-label="Account">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-wrap items-center justify-end gap-1">
        <Link href="/login" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
          Sign in
        </Link>
        <Link href="/signup" className={cn(buttonVariants({ variant: "default", size: "sm" }))}>
          Sign up
        </Link>
        <Link href="/api-docs" className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
          API docs
        </Link>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "gap-1.5 font-normal"
        )}
      >
        <span className="max-w-[160px] truncate">{user?.email}</span>
        <ChevronDownIcon className="size-4 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="min-w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5 px-2 py-1.5 font-normal">
          <span className="text-xs font-medium text-muted-foreground">Signed in</span>
          <span className="truncate text-sm text-foreground">{user?.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuItem onClick={() => router.push("/dashboard")}>Dashboard</DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/api-docs")}>API docs</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => void signOut()}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
