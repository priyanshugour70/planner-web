"use client";

import { useState } from "react";
import { LayoutGridIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PLANNER_MODULES } from "@/lib/nav/modules";
import { CommandPalette } from "@/components/nav/command-palette";

export function PlannerLauncher() {
  const [open, setOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <CommandPalette open={palette} onOpenChange={setPalette} />
      <div
        className={cn(
          "fixed z-40 flex flex-col items-end gap-2",
          "bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))]",
          "md:bottom-6 md:right-6"
        )}
      >
        {open ? (
          <div
            role="menu"
            aria-label="Modules"
            className="mb-1 w-[min(100vw-2rem,20rem)] rounded-xl border bg-popover p-2 shadow-lg animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="mb-1 flex items-center justify-between px-1">
              <span className="text-xs font-medium text-muted-foreground">Modules</span>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Close launcher" onClick={() => setOpen(false)}>
                <XIcon className="size-4" />
              </Button>
            </div>
            <ul className="grid gap-0.5">
              {PLANNER_MODULES.map((m) => {
                const active =
                  m.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname === m.href || pathname.startsWith(`${m.href}/`);
                return (
                  <li key={m.href}>
                    <Link
                      href={m.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        buttonVariants({ variant: active ? "secondary" : "ghost", size: "sm" }),
                        "w-full justify-start font-normal"
                      )}
                    >
                      {m.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
            <Button type="button" variant="outline" size="sm" className="mt-2 w-full" onClick={() => { setOpen(false); setPalette(true); }}>
              Search… <span className="ml-auto text-[10px] text-muted-foreground">⌘K</span>
            </Button>
          </div>
        ) : null}
        <div className="flex gap-2">
          <Button
            type="button"
            size="icon"
            className="size-12 rounded-full shadow-md"
            aria-expanded={open}
            aria-haspopup="menu"
            aria-label={open ? "Close module launcher" : "Open module launcher"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <XIcon className="size-5" /> : <LayoutGridIcon className="size-5" />}
          </Button>
        </div>
      </div>
    </>
  );
}
