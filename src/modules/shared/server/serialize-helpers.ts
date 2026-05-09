export function iso(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString();
}

export function isoDate(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}
