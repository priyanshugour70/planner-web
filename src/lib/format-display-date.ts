const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

/** `YYYY-MM-DD` → `15 Jan 2026`. */
export function formatDisplayDate(iso: string | null | undefined): string {
  if (!iso || typeof iso !== "string") return "—";
  const day = iso.slice(8, 10);
  const mon = Number(iso.slice(5, 7));
  const year = iso.slice(0, 4);
  if (!/^\d{4}$/.test(year) || !Number.isFinite(mon) || mon < 1 || mon > 12 || !/^\d{2}$/.test(day)) return "—";
  return `${Number(day)} ${MONTHS[mon - 1]} ${year}`;
}
