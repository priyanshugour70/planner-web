export type PlannerModule = {
  href: string;
  label: string;
  keywords: string;
};

export const PLANNER_MODULES: readonly PlannerModule[] = [
  { href: "/dashboard", label: "Overview", keywords: "home summary dashboard" },
  { href: "/goals", label: "Goals", keywords: "milestones outcomes" },
  { href: "/tasks", label: "Tasks", keywords: "todo work" },
  { href: "/finance", label: "Finance", keywords: "money budget spend income" },
  { href: "/habits", label: "Habits", keywords: "streak daily" },
  { href: "/notes", label: "Notes", keywords: "capture pin" },
  { href: "/journal", label: "Journal", keywords: "reflect diary" },
  { href: "/calendar", label: "Calendar", keywords: "events schedule" },
] as const;

export function moduleTitleFromPath(pathname: string | null): string {
  if (!pathname) return "Planner";
  const hit = PLANNER_MODULES.find((m) => m.href !== "/dashboard" && pathname.startsWith(m.href));
  if (hit) return hit.label;
  if (pathname.startsWith("/dashboard")) return "Overview";
  return "Planner";
}
