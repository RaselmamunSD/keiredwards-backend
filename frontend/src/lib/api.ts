export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  status_code: number;
}

/** Backend error shape from `apps.core.exceptions.custom_exception_handler` */
export interface ApiErrorBody {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[] | string | unknown>;
  status_code?: number;
}

function formatApiErrorMessage(payload: ApiErrorBody): string {
  const msg = payload.message;
  if (msg && msg !== "Request failed.") {
    return msg;
  }
  const errors = payload.errors;
  if (errors && typeof errors === "object" && !Array.isArray(errors)) {
    const parts: string[] = [];
    for (const [key, val] of Object.entries(errors)) {
      if (key === "detail") {
        if (Array.isArray(val)) parts.push(val.join(", "));
        else if (typeof val === "string") parts.push(val);
        continue;
      }
      if (Array.isArray(val)) {
        parts.push(`${key}: ${val.join(", ")}`);
      } else if (typeof val === "string") {
        parts.push(`${key}: ${val}`);
      }
    }
    const joined = parts.filter(Boolean).join(" ");
    if (joined) {
      return joined;
    }
  }
  return msg || "Request failed.";
}

export class ApiRequestError extends Error {
  readonly statusCode: number;
  readonly body: ApiErrorBody;

  constructor(message: string, statusCode: number, body: ApiErrorBody) {
    super(message);
    this.name = "ApiRequestError";
    this.statusCode = statusCode;
    this.body = body;
  }
}

interface TokenPair {
  access: string;
  refresh: string;
}

const ACCESS_KEY = "auth_access_token";
const REFRESH_KEY = "auth_refresh_token";

export const tokenStorage = {
  getAccess() {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(ACCESS_KEY) || "";
  },
  getRefresh() {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(REFRESH_KEY) || "";
  },
  set(tokens: TokenPair) {
    localStorage.setItem(ACCESS_KEY, tokens.access);
    localStorage.setItem(REFRESH_KEY, tokens.refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

async function rawRequest<T>(
  endpoint: string,
  method: HttpMethod,
  body?: unknown,
  token?: string
): Promise<ApiEnvelope<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/v1/${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let payload: ApiEnvelope<T> & ApiErrorBody;
  try {
    payload = (await response.json()) as ApiEnvelope<T> & ApiErrorBody;
  } catch {
    throw new ApiRequestError("Invalid response from server.", response.status, {});
  }

  if (!response.ok) {
    const text = formatApiErrorMessage(payload);
    throw new ApiRequestError(text, response.status, payload);
  }
  if (payload.success === false) {
    const text = formatApiErrorMessage(payload);
    throw new ApiRequestError(text, response.status, payload);
  }
  return payload as ApiEnvelope<T>;
}

async function refreshAccessToken(refresh: string): Promise<string> {
  const response = await rawRequest<{ access: string }>(
    "auth/token/refresh/",
    "POST",
    { refresh }
  );
  const newAccess = response.data.access;
  tokenStorage.set({ access: newAccess, refresh });
  return newAccess;
}

export async function authorizedRequest<T>(
  endpoint: string,
  method: HttpMethod,
  body?: unknown
): Promise<ApiEnvelope<T>> {
  let access = tokenStorage.getAccess();
  const refresh = tokenStorage.getRefresh();

  try {
    return await rawRequest<T>(endpoint, method, body, access);
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : "";
    if (!refresh || (!message.includes("token") && !message.includes("authentication"))) {
      throw error;
    }
    access = await refreshAccessToken(refresh);
    return rawRequest<T>(endpoint, method, body, access);
  }
}

export const api = {
  register: (payload: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name?: string;
    last_name?: string;
  }) => rawRequest<{ user: unknown; tokens: { access: string; refresh: string } }>("auth/register/", "POST", payload),
  login: (credentials: { username: string; password: string }) =>
    rawRequest<{ access: string; refresh: string }>("auth/login/", "POST", credentials),
  logout: () =>
    authorizedRequest<{}>("auth/logout/", "POST", { refresh: tokenStorage.getRefresh() }),
  passwordReset: (email: string) =>
    rawRequest<{ uid: string; token: string }>("auth/password/reset/", "POST", { email }),
  passwordResetConfirm: (payload: {
    uid: string;
    token: string;
    new_password: string;
    new_password_confirm: string;
  }) => rawRequest<{}>("auth/password/reset/confirm/", "POST", payload),
  profile: () =>
    authorizedRequest<{
      id: number;
      username: string;
      email: string;
      first_name: string;
      last_name: string;
      phone: string;
    }>("auth/profile/", "GET"),
  paymentsCreate: (payload: { amount: number; currency: string; metadata?: Record<string, unknown> }) =>
    authorizedRequest<{ checkout_url: string; payment: { gateway_reference: string } }>(
      "payments/create/",
      "POST",
      payload
    ),
  paymentsVerify: (reference: string) =>
    authorizedRequest<{ payment: { status: string; transaction_id: string } }>(
      "payments/verify/",
      "POST",
      { reference }
    ),
  dashboardSummary: () =>
    authorizedRequest<{
      total_payments: number;
      completed_payment_amount: number;
      pending_payments: number;
      failed_payments: number;
    }>("dashboard/summary/", "GET"),
  dashboardAnalytics: (days = 30) =>
    authorizedRequest<{
      period_days: number;
      status_breakdown: Record<string, number>;
      daily_completed_amount: Array<{ day: string; amount: number }>;
    }>(`dashboard/analytics/?days=${days}`, "GET"),
};
