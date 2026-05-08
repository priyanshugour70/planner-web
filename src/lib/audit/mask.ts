const SENSITIVE_KEYS = new Set(
  [
    "password",
    "passwordhash",
    "password_hash",
    "currentpassword",
    "newpassword",
    "oldpassword",
    "token",
    "accesstoken",
    "access_token",
    "refreshtoken",
    "refresh_token",
    "authorization",
    "cookie",
    "set-cookie",
    "secret",
    "otp",
    "code",
    "backupcodes",
    "backup_codes",
    "client_secret",
    "apikey",
    "api_key",
  ].map((k) => k.toLowerCase())
);

function normalizeKey(key: string): string {
  return key.replace(/[_-]/g, "").toLowerCase();
}

export function maskSensitiveValue(key: string): boolean {
  const n = normalizeKey(key);
  for (const s of SENSITIVE_KEYS) {
    if (n.includes(s.replace(/_/g, ""))) return true;
  }
  return false;
}

export function maskSensitiveObject(
  value: unknown,
  depth = 0
): unknown {
  if (depth > 8) return "[truncated-depth]";
  if (value === null || value === undefined) return value;
  if (typeof value === "string") {
    return value.length > 4096 ? `${value.slice(0, 4096)}…` : value;
  }
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.map((v) => maskSensitiveObject(v, depth + 1));
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (maskSensitiveValue(k)) {
      out[k] = "[redacted]";
    } else {
      out[k] = maskSensitiveObject(v, depth + 1);
    }
  }
  return out;
}

export function truncateJson(value: unknown, maxBytes = 32_000): unknown {
  try {
    const s = JSON.stringify(value);
    if (s.length <= maxBytes) return value;
    return { truncated: true, preview: s.slice(0, maxBytes) };
  } catch {
    return { truncated: true };
  }
}
