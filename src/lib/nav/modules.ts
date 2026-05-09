import { PRODUCT_NAME } from "@/lib/product";

/** A first-class product module (Goals, Finance, Notes, …). Not the product itself. */
export type WorkspaceModule = {
  href: string;
  label: string;
  keywords: string;
};

export const WORKSPACE_MODULES: readonly WorkspaceModule[] = [
  { href: "/dashboard", label: "Overview", keywords: "home summary dashboard" },
  { href: "/goals", label: "Goals", keywords: "milestones outcomes" },
  { href: "/tasks", label: "Tasks", keywords: "todo work" },
  { href: "/finance", label: "Finance", keywords: "money budget spend income" },
  { href: "/habits", label: "Habits", keywords: "streak daily" },
  { href: "/notes", label: "Notes", keywords: "capture pin" },
  { href: "/journal", label: "Journal", keywords: "reflect diary" },
  { href: "/calendar", label: "Calendar", keywords: "events schedule" },
] as const;

/** Current module label for the shell chrome, or the product name when the route is not a module root. */
export function moduleTitleFromPath(pathname: string | null): string {
  if (!pathname) return PRODUCT_NAME;
  const hit = WORKSPACE_MODULES.find(
    (m) => m.href !== "/dashboard" && pathname.startsWith(m.href)
  );
  if (hit) return hit.label;
  if (pathname.startsWith("/dashboard")) return "Overview";
  return PRODUCT_NAME;
}
