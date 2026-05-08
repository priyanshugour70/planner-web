export type { APIEnvelope, APIErrorEnvelope, APISuccessEnvelope, APIErrorPayload } from "./api-response";
export { ErrorCodes, type ErrorCode } from "./api-error";

/** @deprecated Prefer APISuccessEnvelope from api-response.ts */
export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: LegacyAPIError | string;
  message?: string;
  timestamp?: string;
  requestId?: string;
}

export interface LegacyAPIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export interface PaginatedMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedSuccess<T> {
  success: true;
  message: string;
  data: T[];
  meta: { pagination: PaginatedMeta } & Record<string, unknown>;
  timestamp: string;
  requestId: string;
}

export function paginatedEnvelope<T>(
  requestId: string,
  data: T[],
  page: number,
  limit: number,
  total: number,
  message = ""
): PaginatedSuccess<T> {
  const totalPages = Math.ceil(total / limit) || 0;
  return {
    success: true,
    message,
    data,
    meta: {
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    },
    timestamp: new Date().toISOString(),
    requestId,
  };
}

export function getErrorMessage(error?: LegacyAPIError | string): string {
  if (!error) return "An error occurred";
  if (typeof error === "string") return error;
  return error.message || "An error occurred";
}

export interface FilterParams {
  search?: string;
  category?: string;
  tags?: string[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginationParams {
  page: number;
  pageSize: number;
  total?: number;
}

export type ApiResponse<T> = APIResponse<T>;
