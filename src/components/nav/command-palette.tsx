"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { Command } from "cmdk";
import { SearchIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { WORKSPACE_MODULES } from "@/lib/nav/modules";
import { cn } from "@/lib/utils";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();

  const navigate = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router]
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[15%] max-w-lg translate-y-0 gap-0 overflow-hidden p-0 sm:top-[12%]"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Jump to a workspace module</DialogTitle>
        <Command className="rounded-lg border-0 bg-popover" shouldFilter label="Workspace modules">
          <div className="flex items-center border-b px-3">
            <SearchIcon className="mr-2 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <Command.Input
              placeholder="Search workspace modules…"
              className="flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden shrink-0 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
              Esc
            </kbd>
          </div>
          <Command.List className="max-h-72 overflow-y-auto p-1">
            <Command.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">No matches.</Command.Empty>
            <Command.Group
              heading="Workspace modules"
              className="text-xs font-medium text-muted-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
            >
              {WORKSPACE_MODULES.map((m) => (
                <Command.Item
                  key={m.href}
                  value={`${m.label} ${m.keywords}`}
                  onSelect={() => navigate(m.href)}
                  className={cn(
                    "flex cursor-pointer select-none items-center rounded-md px-2 py-2 text-sm outline-none",
                    "data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                  )}
                >
                  {m.label}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
