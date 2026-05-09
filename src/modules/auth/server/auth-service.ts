import "server-only";
import { decodeJwt } from "jose";
import { getSql } from "@/lib/db";
import { getServerEnv } from "@/lib/config/server-env";
import { hashPassword, verifyPassword } from "@/modules/auth/server/password";
import {
  generateAccessJti,
  generateOtpCode,
  generateRefreshToken,
  hashOpaqueToken,
} from "@/modules/auth/server/token-hash";
import { signAccessToken, verifyAccessToken } from "@/modules/auth/server/jwt";
import { parseUa } from "@/modules/auth/server/ua";
import { HttpError } from "@/modules/auth/server/http-error";
import type { z } from "zod";
import type {
  changePasswordBodySchema,
  forgotPasswordBodySchema,
  loginBodySchema,
  resetPasswordBodySchema,
  sendOtpBodySchema,
  signupBodySchema,
  verifyOtpBodySchema,
} from "@/modules/auth/server/validators";

type Signup = z.infer<typeof signupBodySchema>;
type Login = z.infer<typeof loginBodySchema>;
type RefreshInput = { refreshToken?: string | null };
type Forgot = z.infer<typeof forgotPasswordBodySchema>;
type Reset = z.infer<typeof resetPasswordBodySchema>;
type SendOtp = z.infer<typeof sendOtpBodySchema>;
type VerifyOtp = z.infer<typeof verifyOtpBodySchema>;
type ChangePw = z.infer<typeof changePasswordBodySchema>;

const MAX_LOGIN_FAILS = 5;
const LOCK_MINUTES = 15;
const OTP_TTL_MIN = 10;
const OTP_RESEND_SEC = 60;

function otpPepper(): string {
  return process.env.OTP_PEPPER?.trim() || getServerEnv().JWT_SECRET;
}

function normalizeIp(ip?: string | null): string | null {
  if (!ip) return null;
  const v = ip.trim().slice(0, 80);
  if (/^[\d.a-fA-F:]+$/.test(v) || v.includes(".")) return v;
  return null;
}

async function loadUserRoles(userId: bigint) {
  const sql = getSql();
  const rows = await sql<{ slug: string }[]>`
    SELECT r.slug
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = ${userId}
  `;
  return rows.map((r: { slug: string }) => r.slug);
}

async function issueSessionBundle(input: {
  userId: bigint;
  publicId: string;
  roles: string[];
  deviceId?: string | null;
  userAgent?: string | null;
  ip?: string | null;
}) {
  const sql = getSql();
  const env = getServerEnv();
  const ua = parseUa(input.userAgent ?? undefined);
  const refreshTtl = env.REFRESH_TOKEN_TTL_SECONDS;
  const expiresAt = new Date(Date.now() + refreshTtl * 1000);

  const [session] = await sql<{ id: string }[]>`
    INSERT INTO sessions (
      user_id, device_id, user_agent, ip_address,
      device_type, platform, browser, os,
      last_activity_at, expires_at
    ) VALUES (
      ${input.userId},
      ${input.deviceId ?? null},
      ${input.userAgent ?? null},
      ${normalizeIp(input.ip)},
      ${ua.deviceType},
      ${ua.platform},
      ${ua.browser},
      ${ua.os},
      NOW(),
      ${expiresAt}
    )
    RETURNING id::text AS id
  `;

  if (!session) throw new HttpError(500, "INTERNAL_ERROR", "Could not create session");

  const rawRefresh = generateRefreshToken();
  const tokenHash = hashOpaqueToken(rawRefresh, env.JWT_SECRET);

  const [rt] = await sql<{ id: bigint }[]>`
    INSERT INTO refresh_tokens (user_id, session_id, token_hash, expires_at)
    VALUES (${input.userId}, ${session.id}::uuid, ${tokenHash}, ${expiresAt})
    RETURNING id
  `;

  if (!rt) throw new HttpError(500, "INTERNAL_ERROR", "Could not create refresh token");

  const jti = generateAccessJti();
  const accessToken = await signAccessToken({
    userId: input.userId,
    sessionId: session.id,
    publicId: input.publicId,
    roles: input.roles,
    jti,
  });

  return {
    accessToken,
    refreshToken: rawRefresh,
    expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
    tokenType: "Bearer" as const,
    sessionId: session.id,
    refreshTokenId: rt.id,
  };
}

function mapUserPublic(row: {
  public_id: string;
  username: string;
  email: string;
  email_verified: boolean;
  account_status: string;
}) {
  return {
    id: row.public_id,
    username: row.username,
    email: row.email,
    emailVerified: row.email_verified,
    accountStatus: row.account_status,
  };
}

export async function signup(body: Signup) {
  const sql = getSql();

  const dup = await sql<{ kind: string }[]>`
    SELECT 'email' AS kind FROM users WHERE lower(email) = lower(${body.email}) AND deleted_at IS NULL
    UNION ALL
    SELECT 'username' FROM users WHERE lower(username) = lower(${body.username}) AND deleted_at IS NULL
    LIMIT 1
  `;
  if (dup.length) {
    throw new HttpError(409, "ALREADY_EXISTS", "Email or username already registered");
  }

  const password_hash = await hashPassword(body.password);

  const [user] = await sql<
    {
      id: bigint;
      public_id: string;
      username: string;
      email: string;
      email_verified: boolean;
      account_status: string;
    }[]>`
    INSERT INTO users (username, email, password_hash, account_status, email_verified)
    VALUES (
      ${body.username},
      ${body.email},
      ${password_hash},
      'pending_verification',
      FALSE
    )
    RETURNING id, public_id::text, username, email, email_verified, account_status::text
  `;

  if (!user) throw new HttpError(500, "INTERNAL_ERROR", "Signup failed");

  await sql`
    INSERT INTO user_profiles (user_id, full_name)
    VALUES (${user.id}, ${body.fullName ?? null})
  `;

  const [role] = await sql<{ id: bigint }[]>`
    SELECT id FROM roles WHERE slug = 'user' LIMIT 1
  `;
  if (role) {
    await sql`
      INSERT INTO user_roles (user_id, role_id)
      VALUES (${user.id}, ${role.id})
      ON CONFLICT DO NOTHING
    `;
  }

  const roles = await loadUserRoles(user.id);
  const tokens = await issueSessionBundle({
    userId: user.id,
    publicId: user.public_id,
    roles,
    userAgent: null,
    ip: null,
  });

  return {
    user: mapUserPublic(user),
    ...tokens,
  };
}

export async function login(
  body: Login,
  meta: { userAgent?: string | null; ip?: string | null }
) {
  const sql = getSql();

  const [user] = await sql<
    {
      id: bigint;
      public_id: string;
      username: string;
      email: string;
      password_hash: string;
      email_verified: boolean;
      account_status: string;
      login_attempts: number;
      locked_until: Date | null;
    }[]>`
    SELECT
      id,
      public_id::text,
      username,
      email,
      password_hash,
      email_verified,
      account_status::text,
      login_attempts,
      locked_until
    FROM users
    WHERE lower(email) = lower(${body.email}) AND deleted_at IS NULL
    LIMIT 1
  `;

  const fail = async (reason: string) => {
    if (user) {
      const attempts = user.login_attempts + 1;
      const lockedUntil =
        attempts >= MAX_LOGIN_FAILS
          ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
          : user.locked_until;
      await sql`
        UPDATE users
        SET login_attempts = ${attempts},
            locked_until = ${lockedUntil},
            updated_at = NOW()
        WHERE id = ${user.id}
      `;
      await sql`
        INSERT INTO login_history (user_id, success, failure_reason, ip_address, user_agent)
        VALUES (${user.id}, FALSE, ${reason}, ${normalizeIp(meta.ip)}, ${meta.userAgent ?? null})
      `;
    }
  };

  if (!user) {
    await fail("USER_NOT_FOUND");
    throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  if (user.account_status === "suspended" || user.account_status === "deleted") {
    throw new HttpError(403, "FORBIDDEN", "Account is not active");
  }

  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw new HttpError(423, "ACCOUNT_LOCKED", "Account temporarily locked. Try again later.");
  }

  const ok = await verifyPassword(body.password, user.password_hash);
  if (!ok) {
    await fail("BAD_PASSWORD");
    throw new HttpError(401, "INVALID_CREDENTIALS", "Invalid email or password");
  }

  await sql`
    UPDATE users
    SET login_attempts = 0,
        locked_until = NULL,
        last_login_at = NOW(),
        updated_at = NOW()
    WHERE id = ${user.id}
  `;

  const roles = await loadUserRoles(user.id);
  const tokens = await issueSessionBundle({
    userId: user.id,
    publicId: user.public_id,
    roles,
    deviceId: body.deviceId,
    userAgent: meta.userAgent,
    ip: meta.ip,
  });

  await sql`
    INSERT INTO login_history (user_id, session_id, success, ip_address, user_agent)
    VALUES (${user.id}, ${tokens.sessionId}::uuid, TRUE, ${normalizeIp(meta.ip)}, ${meta.userAgent ?? null})
  `;

  return {
    user: mapUserPublic(user),
    ...tokens,
  };
}

export async function refresh(body: RefreshInput) {
  const sql = getSql();
  const env = getServerEnv();
  const rawIn = (body.refreshToken ?? "").trim();
  if (!rawIn) {
    throw new HttpError(401, "UNAUTHORIZED", "Missing refresh token");
  }
  const hash = hashOpaqueToken(rawIn, env.JWT_SECRET);

  const [row] = await sql<
    {
      id: bigint;
      user_id: bigint;
      session_id: string;
      family_id: string;
      expires_at: Date;
      revoked_at: Date | null;
      replaced_by_id: bigint | null;
    }[]>`
    SELECT id, user_id, session_id::text, family_id::text, expires_at, revoked_at, replaced_by_id
    FROM refresh_tokens
    WHERE token_hash = ${hash}
    LIMIT 1
  `;

  if (!row || row.revoked_at || row.replaced_by_id) {
    throw new HttpError(401, "INVALID_TOKEN", "Refresh token is invalid or revoked");
  }
  if (new Date(row.expires_at) < new Date()) {
    throw new HttpError(401, "TOKEN_EXPIRED", "Refresh token expired");
  }

  const [sess] = await sql<{ revoked_at: Date | null; user_id: bigint }[]>`
    SELECT revoked_at, user_id FROM sessions WHERE id = ${row.session_id}::uuid LIMIT 1
  `;
  if (!sess || sess.revoked_at || sess.user_id !== row.user_id) {
    throw new HttpError(401, "SESSION_REVOKED", "Session is no longer valid");
  }

  const [u] = await sql<
    {
      id: bigint;
      public_id: string;
      username: string;
      email: string;
      email_verified: boolean;
      account_status: string;
    }[]>`
    SELECT id, public_id::text, username, email, email_verified, account_status::text
    FROM users WHERE id = ${row.user_id} AND deleted_at IS NULL LIMIT 1
  `;
  if (!u) throw new HttpError(401, "INVALID_TOKEN", "User not found");

  const rawRefresh = generateRefreshToken();
  const newHash = hashOpaqueToken(rawRefresh, env.JWT_SECRET);
  const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_TTL_SECONDS * 1000);

  const [newRt] = await sql<{ id: bigint }[]>`
    INSERT INTO refresh_tokens (user_id, session_id, token_hash, family_id, expires_at)
    VALUES (${row.user_id}, ${row.session_id}::uuid, ${newHash}, ${row.family_id}::uuid, ${expiresAt})
    RETURNING id
  `;

  if (!newRt) throw new HttpError(500, "INTERNAL_ERROR", "Refresh rotation failed");

  await sql`
    UPDATE refresh_tokens
    SET revoked_at = NOW(), replaced_by_id = ${newRt.id}
    WHERE id = ${row.id}
  `;

  const roles = await loadUserRoles(row.user_id);
  const jti = generateAccessJti();
  const accessToken = await signAccessToken({
    userId: row.user_id,
    sessionId: row.session_id,
    publicId: u.public_id,
    roles,
    jti,
  });

  return {
    user: mapUserPublic(u),
    accessToken,
    refreshToken: rawRefresh,
    expiresIn: env.ACCESS_TOKEN_TTL_SECONDS,
    tokenType: "Bearer" as const,
    sessionId: row.session_id,
  };
}

export async function logout(input: {
  accessToken?: string | null;
  refreshToken?: string | null;
}) {
  const sql = getSql();
  const env = getServerEnv();

  if (input.accessToken) {
    try {
      const payload = decodeJwt(input.accessToken);
      const jti = typeof payload.jti === "string" ? payload.jti : "";
      const sub = typeof payload.sub === "string" ? payload.sub : "";
      const sid = typeof payload.sid === "string" ? payload.sid : "";
      if (jti && sub && sid) {
        const userId = BigInt(sub);
        const expSec = typeof payload.exp === "number" ? payload.exp : null;
        const exp = expSec
          ? new Date(expSec * 1000)
          : new Date(Date.now() + getServerEnv().ACCESS_TOKEN_TTL_SECONDS * 1000);
        await sql`
          INSERT INTO access_token_revocations (jti, user_id, session_id, expires_at)
          VALUES (${jti}, ${userId}, ${sid}::uuid, ${exp})
          ON CONFLICT (jti) DO NOTHING
        `;
        await sql`
          UPDATE sessions SET revoked_at = NOW() WHERE id = ${sid}::uuid
        `;
      }
    } catch {
      /* ignore malformed JWT on logout */
    }
  }

  if (input.refreshToken) {
    const hash = hashOpaqueToken(input.refreshToken, env.JWT_SECRET);
    await sql`
      UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ${hash}
    `;
    await sql`
      UPDATE sessions SET revoked_at = NOW()
      WHERE id IN (SELECT session_id FROM refresh_tokens WHERE token_hash = ${hash})
    `;
  }

  return { ok: true as const };
}

export async function forgotPassword(body: Forgot) {
  const sql = getSql();
  const [user] = await sql<{ id: bigint }[]>`
    SELECT id FROM users WHERE lower(email) = lower(${body.email}) AND deleted_at IS NULL LIMIT 1
  `;
  if (!user) {
    return { ok: true as const, message: "If the account exists, a reset code will be sent." };
  }

  const code = generateOtpCode(6);
  const codeHash = hashOpaqueToken(code, otpPepper());
  const expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);
  const resendAfter = new Date(Date.now() + OTP_RESEND_SEC * 1000);

  await sql`
    INSERT INTO otps (user_id, channel, destination, code_hash, purpose, expires_at, resend_after)
    VALUES (${user.id}, 'email', ${body.email}, ${codeHash}, 'password_reset', ${expiresAt}, ${resendAfter})
  `;

  const showDev =
    process.env.NODE_ENV !== "production" && process.env.SHOW_DEV_OTP === "true";

  return {
    ok: true as const,
    message: "If the account exists, a reset code will be sent.",
    ...(showDev ? { devOtp: code } : {}),
  };
}

export async function resetPassword(body: Reset) {
  const sql = getSql();
  const codeHash = hashOpaqueToken(body.code, otpPepper());

  const [otp] = await sql<
    { id: bigint; user_id: bigint; attempts: number; max_attempts: number; consumed_at: Date | null; expires_at: Date }[]
  >`
    SELECT id, user_id, attempts, max_attempts, consumed_at, expires_at
    FROM otps
    WHERE destination = lower(${body.email})
      AND purpose = 'password_reset'
      AND consumed_at IS NULL
    ORDER BY id DESC
    LIMIT 1
  `;

  if (!otp || otp.consumed_at) {
    throw new HttpError(400, "OTP_INVALID", "Invalid or expired reset code");
  }
  if (new Date(otp.expires_at) < new Date()) {
    throw new HttpError(400, "OTP_EXPIRED", "Reset code has expired");
  }
  if (otp.attempts >= otp.max_attempts) {
    throw new HttpError(400, "OTP_INVALID", "Too many attempts");
  }

  const [storedOtp] = await sql<{ code_hash: string }[]>`
    SELECT code_hash FROM otps WHERE id = ${otp.id} LIMIT 1
  `;
  if (!storedOtp || storedOtp.code_hash !== codeHash) {
    await sql`UPDATE otps SET attempts = attempts + 1 WHERE id = ${otp.id}`;
    throw new HttpError(400, "OTP_INVALID", "Invalid reset code");
  }

  const newHash = await hashPassword(body.newPassword);
  await sql`
    UPDATE users SET password_hash = ${newHash}, password_changed_at = NOW(), updated_at = NOW()
    WHERE id = ${otp.user_id}
  `;
  await sql`
    UPDATE otps SET consumed_at = NOW() WHERE id = ${otp.id}
  `;
  await sql`
    UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ${otp.user_id}
  `;
  await sql`
    UPDATE sessions SET revoked_at = NOW() WHERE user_id = ${otp.user_id}
  `;

  return { ok: true as const, message: "Password has been reset" };
}

export async function sendOtp(body: SendOtp) {
  const sql = getSql();

  const [latest] = await sql<{ resend_after: Date | null; consumed_at: Date | null }[]>`
    SELECT resend_after, consumed_at
    FROM otps
    WHERE lower(destination) = lower(${body.email}) AND purpose = ${body.purpose}
    ORDER BY id DESC
    LIMIT 1
  `;

  if (latest?.resend_after && new Date(latest.resend_after) > new Date()) {
    const retry = Math.ceil((new Date(latest.resend_after).getTime() - Date.now()) / 1000);
    throw new HttpError(429, "OTP_COOLDOWN", "Please wait before requesting another code", {
      retryAfterSeconds: retry,
    });
  }

  const [user] = await sql<{ id: bigint }[]>`
    SELECT id FROM users WHERE lower(email) = lower(${body.email}) AND deleted_at IS NULL LIMIT 1
  `;

  if (!user) {
    throw new HttpError(404, "NOT_FOUND", "No account for this email");
  }

  const code = generateOtpCode(6);
  const codeHash = hashOpaqueToken(code, otpPepper());
  const expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);
  const resendAfter = new Date(Date.now() + OTP_RESEND_SEC * 1000);

  await sql`
    INSERT INTO otps (user_id, channel, destination, code_hash, purpose, expires_at, resend_after)
    VALUES (${user.id}, 'email', ${body.email}, ${codeHash}, ${body.purpose}, ${expiresAt}, ${resendAfter})
  `;

  const showDev =
    process.env.NODE_ENV !== "production" && process.env.SHOW_DEV_OTP === "true";

  return {
    ok: true as const,
    message: "Verification code sent",
    ...(showDev ? { devOtp: code } : {}),
  };
}

export async function verifyOtp(body: VerifyOtp) {
  const sql = getSql();
  const codeHash = hashOpaqueToken(body.code, otpPepper());

  const [otp] = await sql<
    {
      id: bigint;
      user_id: bigint | null;
      attempts: number;
      max_attempts: number;
      consumed_at: Date | null;
      expires_at: Date;
      purpose: string;
    }[]>`
    SELECT id, user_id, attempts, max_attempts, consumed_at, expires_at, purpose::text
    FROM otps
    WHERE lower(destination) = lower(${body.email})
      AND purpose = ${body.purpose}
      AND consumed_at IS NULL
    ORDER BY id DESC
    LIMIT 1
  `;

  if (!otp) throw new HttpError(400, "OTP_INVALID", "Invalid code");
  if (new Date(otp.expires_at) < new Date()) {
    throw new HttpError(400, "OTP_EXPIRED", "Code expired");
  }
  if (otp.attempts >= otp.max_attempts) {
    throw new HttpError(400, "OTP_INVALID", "Too many attempts");
  }

  const [row] = await sql<{ code_hash: string }[]>`
    SELECT code_hash FROM otps WHERE id = ${otp.id} LIMIT 1
  `;
  if (!row || row.code_hash !== codeHash) {
    await sql`UPDATE otps SET attempts = attempts + 1 WHERE id = ${otp.id}`;
    throw new HttpError(400, "OTP_INVALID", "Invalid code");
  }

  await sql`UPDATE otps SET consumed_at = NOW() WHERE id = ${otp.id}`;

  if (body.purpose === "email_verification") {
    if (!otp.user_id) {
      throw new HttpError(400, "VALIDATION_ERROR", "OTP is not linked to a user");
    }
    await sql`
      UPDATE users SET email_verified = TRUE, email_verified_at = NOW(), updated_at = NOW()
      WHERE id = ${otp.user_id}
    `;
    return { ok: true as const, message: "Email verified" };
  }

  if (body.purpose === "login") {
    const [user] = await sql<
      { id: bigint; public_id: string; username: string; email: string; email_verified: boolean; account_status: string }[]>`
      SELECT id, public_id::text, username, email, email_verified, account_status::text
      FROM users WHERE lower(email) = lower(${body.email}) AND deleted_at IS NULL LIMIT 1
    `;
    if (!user) throw new HttpError(404, "NOT_FOUND", "User not found");
    const roles = await loadUserRoles(user.id);
    const tokens = await issueSessionBundle({
      userId: user.id,
      publicId: user.public_id,
      roles,
    });
    return { user: mapUserPublic(user), ...tokens };
  }

  return { ok: true as const, message: "OTP verified" };
}

export async function changePassword(
  auth: { userId: bigint },
  body: ChangePw
) {
  const sql = getSql();
  const [user] = await sql<{ password_hash: string }[]>`
    SELECT password_hash FROM users WHERE id = ${auth.userId} AND deleted_at IS NULL LIMIT 1
  `;
  if (!user) throw new HttpError(404, "NOT_FOUND", "User not found");

  const ok = await verifyPassword(body.currentPassword, user.password_hash);
  if (!ok) throw new HttpError(400, "PASSWORD_MISMATCH", "Current password is incorrect");

  const newHash = await hashPassword(body.newPassword);
  await sql`
    UPDATE users
    SET password_hash = ${newHash}, password_changed_at = NOW(), updated_at = NOW()
    WHERE id = ${auth.userId}
  `;

  await sql`
    UPDATE refresh_tokens SET revoked_at = NOW()
    WHERE user_id = ${auth.userId}
  `;
  await sql`
    UPDATE sessions SET revoked_at = NOW() WHERE user_id = ${auth.userId}
  `;

  return { ok: true as const, message: "Password updated. Sign in again." };
}

export async function getMe(auth: { userId: bigint }) {
  const sql = getSql();
  const [row] = await sql<
    {
      public_id: string;
      username: string;
      email: string;
      email_verified: boolean;
      account_status: string;
      last_login_at: Date | null;
      full_name: string | null;
      first_name: string | null;
      last_name: string | null;
    }[]>`
    SELECT
      u.public_id::text,
      u.username,
      u.email,
      u.email_verified,
      u.account_status::text,
      u.last_login_at,
      p.full_name,
      p.first_name,
      p.last_name
    FROM users u
    LEFT JOIN user_profiles p ON p.user_id = u.id
    WHERE u.id = ${auth.userId} AND u.deleted_at IS NULL
    LIMIT 1
  `;
  if (!row) throw new HttpError(404, "NOT_FOUND", "User not found");

  const roles = await loadUserRoles(auth.userId);

  return {
    id: row.public_id,
    username: row.username,
    email: row.email,
    emailVerified: row.email_verified,
    accountStatus: row.account_status,
    lastLoginAt: row.last_login_at,
    profile: {
      fullName: row.full_name,
      firstName: row.first_name,
      lastName: row.last_name,
    },
    roles,
  };
}

export async function listSessions(auth: { userId: bigint }) {
  const sql = getSql();
  const rows = await sql<
    {
      id: string;
      device_type: string | null;
      platform: string | null;
      browser: string | null;
      os: string | null;
      ip_address: string | null;
      last_activity_at: Date;
      created_at: Date;
      revoked_at: Date | null;
    }[]>`
    SELECT
      id::text,
      device_type,
      platform,
      browser,
      os,
      NULLIF(ip_address::text, '') as ip_address,
      last_activity_at,
      created_at,
      revoked_at
    FROM sessions
    WHERE user_id = ${auth.userId}
    ORDER BY created_at DESC
    LIMIT 50
  `;

  return rows.map((r) => ({
    id: r.id,
    deviceType: r.device_type,
    platform: r.platform,
    browser: r.browser,
    os: r.os,
    ipAddress: r.ip_address,
    lastActivityAt: r.last_activity_at,
    createdAt: r.created_at,
    revoked: Boolean(r.revoked_at),
  }));
}

export async function revokeSession(auth: { userId: bigint; sessionId: string }) {
  const sql = getSql();
  const [s] = await sql<{ id: string }[]>`
    SELECT id::text FROM sessions
    WHERE id = ${auth.sessionId}::uuid AND user_id = ${auth.userId}
    LIMIT 1
  `;
  if (!s) throw new HttpError(404, "NOT_FOUND", "Session not found");

  await sql`UPDATE sessions SET revoked_at = NOW() WHERE id = ${auth.sessionId}::uuid`;
  await sql`
    UPDATE refresh_tokens SET revoked_at = NOW()
    WHERE session_id = ${auth.sessionId}::uuid
  `;

  return { ok: true as const };
}

export async function revokeOtherSessions(auth: {
  userId: bigint;
  currentSessionId: string;
}) {
  const sql = getSql();
  await sql`
    UPDATE sessions SET revoked_at = NOW()
    WHERE user_id = ${auth.userId}
      AND id <> ${auth.currentSessionId}::uuid
      AND revoked_at IS NULL
  `;
  await sql`
    UPDATE refresh_tokens SET revoked_at = NOW()
    WHERE user_id = ${auth.userId}
      AND session_id <> ${auth.currentSessionId}::uuid
      AND revoked_at IS NULL
  `;
  return { ok: true as const };
}

export async function requireBearer(
  authorization: string | null
): Promise<{ userId: bigint; sessionId: string; publicId: string; roles: string[] }> {
  if (!authorization?.startsWith("Bearer ")) {
    throw new HttpError(401, "UNAUTHORIZED", "Missing bearer token");
  }
  const token = authorization.slice("Bearer ".length).trim();
  let claims: Awaited<ReturnType<typeof verifyAccessToken>>;
  try {
    claims = await verifyAccessToken(token);
  } catch {
    throw new HttpError(401, "INVALID_TOKEN", "Invalid or expired access token");
  }
  const sql = getSql();
  const [sess] = await sql<{ revoked_at: Date | null }[]>`
    SELECT revoked_at FROM sessions WHERE id = ${claims.sessionId}::uuid LIMIT 1
  `;
  if (!sess || sess.revoked_at) {
    throw new HttpError(401, "SESSION_REVOKED", "Session revoked");
  }
  return {
    userId: claims.userId,
    sessionId: claims.sessionId,
    publicId: claims.publicId,
    roles: claims.roles,
  };
}
