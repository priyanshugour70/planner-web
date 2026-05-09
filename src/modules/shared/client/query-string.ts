export function q(params: Record<string, string | undefined>): string {
  const e = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") e.set(k, v);
  }
  const s = e.toString();
  return s ? `?${s}` : "";
}
