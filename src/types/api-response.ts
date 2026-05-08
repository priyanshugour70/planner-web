export interface APIErrorPayload {
  code: string;
  details?: Record<string, unknown>;
  stack?: string;
}

export interface APISuccessEnvelope<T> {
  success: true;
  message: string;
  data: T;
  meta: Record<string, unknown>;
  timestamp: string;
  requestId: string;
}

export interface APIErrorEnvelope {
  success: false;
  message: string;
  error: APIErrorPayload;
  timestamp: string;
  requestId: string;
}

export type APIEnvelope<T> = APISuccessEnvelope<T> | APIErrorEnvelope;
