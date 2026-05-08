import { SignJWT, jwtVerify } from "jose";
import { getServerEnv } from "@/lib/config/server-env";
import { getSql } from "@/lib/db";

export interface VerifiedAccessToken {
  userId: bigint;
  sessionId: string;
  publicId: string;
  roles: string[];
  jti: string;
}

function encoderSecret(): Uint8Array {
  return new TextEncoder().encode(getServerEnv().JWT_SECRET);
}

export async function signAccessToken(input: {
  userId: bigint;
  sessionId: string;
  publicId: string;
  roles: string[];
  jti: string;
}): Promise<string> {
  const env = getServerEnv();
  const roles = input.roles.join(",");

  return new SignJWT({
    sid: input.sessionId,
    pid: input.publicId,
    roles,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(input.userId))
    .setJti(input.jti)
    .setIssuer(env.JWT_ISSUER)
    .setAudience(env.JWT_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${env.ACCESS_TOKEN_TTL_SECONDS}s`)
    .sign(encoderSecret());
}

export async function verifyAccessToken(
  token: string
): Promise<VerifiedAccessToken> {
  const env = getServerEnv();
  const { payload } = await jwtVerify(token, encoderSecret(), {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });

  const jti = typeof payload.jti === "string" ? payload.jti : "";
  if (!jti) {
    throw new Error("INVALID_TOKEN");
  }

  const sql = getSql();
  const revoked = await sql<{ jti: string }[]>`
    SELECT jti FROM access_token_revocations WHERE jti = ${jti} LIMIT 1
  `;
  if (revoked.length) {
    throw new Error("TOKEN_REVOKED");
  }

  const sub = typeof payload.sub === "string" ? payload.sub : "";
  const sid = typeof payload.sid === "string" ? payload.sid : "";
  const pid = typeof payload.pid === "string" ? payload.pid : "";
  const rolesRaw = typeof payload.roles === "string" ? payload.roles : "";
  if (!sub || !sid || !pid) {
    throw new Error("INVALID_TOKEN");
  }

  return {
    userId: BigInt(sub),
    sessionId: sid,
    publicId: pid,
    roles: rolesRaw ? rolesRaw.split(",").filter(Boolean) : [],
    jti,
  };
}
