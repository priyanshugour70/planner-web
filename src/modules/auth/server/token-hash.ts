import { createHash, randomBytes, randomInt } from "node:crypto";

export function hashOpaqueToken(raw: string, pepper: string): string {
  return createHash("sha256").update(`${pepper}:${raw}`).digest("hex");
}

export function generateRefreshToken(): string {
  return randomBytes(48).toString("base64url");
}

export function generateAccessJti(): string {
  return randomBytes(16).toString("hex");
}

export function generateOtpCode(length = 6): string {
  const max = 10 ** length - 1;
  const min = 10 ** (length - 1);
  return String(randomInt(min, max + 1));
}
