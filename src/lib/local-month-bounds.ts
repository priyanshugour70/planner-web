/** Local calendar month bounds as `YYYY-MM-DD` (inclusive). */
export function getLocalMonthBounds(d = new Date()): { from: string; to: string } {
  const y = d.getFullYear();
  const m = d.getMonth();
  const from = new Date(y, m, 1);
  const to = new Date(y, m + 1, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    from: `${from.getFullYear()}-${pad(from.getMonth() + 1)}-${pad(from.getDate())}`,
    to: `${to.getFullYear()}-${pad(to.getMonth() + 1)}-${pad(to.getDate())}`,
  };
}

export function getPreviousLocalMonthBounds(d = new Date()): { from: string; to: string } {
  const ref = new Date(d.getFullYear(), d.getMonth() - 1, 15);
  return getLocalMonthBounds(ref);
}
