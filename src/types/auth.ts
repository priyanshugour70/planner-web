import type { APIEnvelope } from "@/types/api-response";

export type AuthUserPublic = {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  accountStatus: string;
};

export type AuthSessionPayload = {
  accessToken: string;
  /** Omitted when refresh is delivered only via httpOnly cookie (normal web client). */
  refreshToken?: string;
  expiresIn: number;
  tokenType: "Bearer";
  sessionId: string;
  user: AuthUserPublic;
};

export type MeResponse = {
  id: string;
  username: string;
  email: string;
  emailVerified: boolean;
  accountStatus: string;
  lastLoginAt: string | null;
  profile: {
    fullName: string | null;
    firstName: string | null;
    lastName: string | null;
  };
  roles: string[];
};

export type ApiResult<T> = APIEnvelope<T>;
