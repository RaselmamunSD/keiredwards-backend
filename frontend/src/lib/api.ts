export const API_URL =
  (typeof window !== "undefined"
    ? (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? (process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000")
      : window.location.origin)
    : (process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000"));

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

export interface StoragePlan {
  gb: number;
  price: string;
  description: string;
  isCurrent?: boolean;
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
  const headers: Record<string, string> = {};
  if (!(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api/v1/${endpoint}`, {
    method,
    headers,
    body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
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
      date_joined?: string;
    }>("auth/profile/", "GET"),
  paymentsCreate: (payload: { amount: number; currency: string; metadata?: Record<string, unknown> }) =>
    authorizedRequest<{ checkout_url: string; payment: { gateway_reference: string } }>(
      "payments/create/",
      "POST",
      payload
    ),
  paymentsVerify: (reference: string) =>
    authorizedRequest<{ payment: { status: string; transaction_id: string; metadata?: Record<string, any> } }>(
      "payments/verify/",
      "POST",
      { reference }
    ),
  getPricingConfig: () =>
    rawRequest<{
      check_in_options: Array<{
        key: string;
        label: string;
        display_label: string;
        price_per_month: number;
        price_1_year: number;
        price_2_years: number;
        price_3_years: number;
      }>;
      add_ons: Array<{
        key: string;
        label: string;
        description: string;
        price: number;
      }>;
    }>("payments/pricing/", "GET"),
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
  getCheckInEmailConfig: () =>
    authorizedRequest<{
      id: number;
      checkin_email: string;
      checkin_password: string;
      checkin_password_enabled: boolean;
      private_email_username: string;
      private_email_address_saved: boolean;
      private_email_password: string;
      private_email_password_saved: boolean;
      updated_at: string;
      created_at: string;
    }>("dashboard/checkin-email/", "GET"),
  saveCheckInEmailConfig: (payload: Partial<{
    checkin_email: string;
    checkin_password: string;
    checkin_password_enabled: boolean;
    private_email_username: string;
    private_email_address_saved: boolean;
    private_email_password: string;
    private_email_password_saved: boolean;
  }>) =>
    authorizedRequest<{
      id: number;
      checkin_email: string;
      checkin_password: string;
      checkin_password_enabled: boolean;
      private_email_username: string;
      private_email_address_saved: boolean;
      private_email_password: string;
      private_email_password_saved: boolean;
    }>("dashboard/checkin-email/", "POST", payload),
  getCheckInSchedule: () =>
    authorizedRequest<{
      id: number;
      day_of_week: string;
      grace_period: string;
      paused: boolean;
      purchased_plan: string;
      renewal_date: string;
    }>("dashboard/checkin-schedule/", "GET"),
  saveCheckInSchedule: (payload: Partial<{
    day_of_week: string;
    grace_period: string;
    paused: boolean;
    purchased_plan: string;
    renewal_date: string;
  }>) =>
    authorizedRequest<{
      id: number;
      day_of_week: string;
      grace_period: string;
      paused: boolean;
      purchased_plan: string;
      renewal_date: string;
    }>("dashboard/checkin-schedule/", "POST", payload),
  getTrustedRecipients: () =>
    authorizedRequest<Array<{
      id: number;
      first_name: string;
      email: string;
      is_owner: boolean;
    }>>("dashboard/trusted-recipients/", "GET"),
  addTrustedRecipient: (payload: { first_name: string; email: string }) =>
    authorizedRequest<{
      id: number;
      first_name: string;
      email: string;
      is_owner: boolean;
    }>("dashboard/trusted-recipients/", "POST", payload),
  deleteTrustedRecipient: (id: number) =>
    authorizedRequest<{}>("dashboard/trusted-recipients/", "DELETE", { id }),
  getEmailTemplate: () =>
    authorizedRequest<{
      id: number;
      template: string;
    }>("dashboard/email-template/", "GET"),
  saveEmailTemplate: (payload: { template: string }) =>
    authorizedRequest<{
      id: number;
      template: string;
    }>("dashboard/email-template/", "POST", payload),
  getPressRelease: () =>
    authorizedRequest<{
      id: number;
      is_active: boolean;
      template: string;
      current_tier: number;
      category?: string;
      subject?: string;
      tiers?: Array<{ count: string; label: string; price: string | null }>;
    }>("dashboard/press-release/", "GET"),
  savePressRelease: (payload: Partial<{
    is_active: boolean;
    template: string;
    current_tier: number;
    category: string;
    subject: string;
  }>) =>
    authorizedRequest<{
      id: number;
      is_active: boolean;
      template: string;
      current_tier: number;
      category?: string;
      subject?: string;
      tiers?: Array<{ count: string; label: string; price: string | null }>;
    }>("dashboard/press-release/", "POST", payload),
  getVaultFiles: () =>
    authorizedRequest<{
      storage_config: { total_storage_gb: number };
      files: Array<{ id: number; file_name: string; file_size_mb: string }>;
      storage_plans?: StoragePlan[];
    }>("dashboard/vault-files/", "GET"),
  saveVaultFiles: (payload: {
    total_storage_gb?: number;
    files?: Array<{ name: string; sizeMB: string }>;
  } | FormData) =>
    authorizedRequest<{
      storage_config: { total_storage_gb: number };
      files: Array<{ id: number; file_name: string; file_size_mb: string }>;
      storage_plans?: StoragePlan[];
    }>("dashboard/vault-files/", "POST", payload),
  downloadVaultFile: async (id: number, fileName: string) => {
    const access = tokenStorage.getAccess();
    const response = await fetch(`${API_URL}/api/v1/dashboard/vault-files/${id}/download/`, {
      headers: {
        Authorization: `Bearer ${access}`,
      },
    });
    if (!response.ok) {
      throw new Error("Failed to download file");
    }
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
  getSetupAccounting: () =>
    authorizedRequest<{
      config: { id: number; two_fa_enabled: boolean; two_fa_email: string; has_two_fa: boolean };
      services: Array<{ id: number; name: string; additional_info: string; active_until: string; is_purchased: boolean }>;
      billing: Array<{ id: number; date: string; description: string; amount: string; is_included: boolean }>;
      history: Array<{ id: number; date: string; time: string; ip: string; login_name: string; device_os: string }>;
      addons?: Array<{ key: string; label: string; description: string; price: number }>;
      press_release_options?: Array<{ key: string; label: string; description: string; price: number }>;
    }>("dashboard/setup-accounting/", "GET"),
  updateSetupAccounting: (payload: {
    two_fa_enabled?: boolean;
    two_fa_email?: string;
    purchase_service?: string;
    purchase_services?: string[];
    renew_services?: string[];
    extra_storage_gb?: number;
    check_in_service?: string;
  }) =>
    authorizedRequest<{
      config: { id: number; two_fa_enabled: boolean; two_fa_email: string; has_two_fa: boolean };
      services: Array<{ id: number; name: string; additional_info: string; active_until: string; is_purchased: boolean }>;
      billing: Array<{ id: number; date: string; description: string; amount: string; is_included: boolean }>;
      history: Array<{ id: number; date: string; time: string; ip: string; login_name: string; device_os: string }>;
      addons?: Array<{ key: string; label: string; description: string; price: number }>;
      press_release_options?: Array<{ key: string; label: string; description: string; price: number }>;
    }>("dashboard/setup-accounting/", "POST", payload),
  passwordChange: (payload: { old_password: string; new_password: string; new_password_confirm: string }) =>
    authorizedRequest<{}>("auth/password/change/", "POST", payload),
  submitContactMessage: (payload: {
    fullName: string;
    email: string;
    subject: string;
    isCustomer: "Yes" | "No";
    message: string;
  }) =>
    rawRequest<{}>("dashboard/contact/", "POST", {
      full_name: payload.fullName,
      email: payload.email,
      subject: payload.subject,
      is_customer: payload.isCustomer,
      message: payload.message,
    }),
  profileUpdate: (payload: Partial<{ username: string; first_name: string; last_name: string; phone: string; bio: string }>) => {
    // Send as FormData because ProfileUpdateView uses MultiPartParser/FormParser
    const formData = new FormData();
    for (const [key, val] of Object.entries(payload)) {
      if (val !== undefined && val !== null) {
        formData.append(key, val as string);
      }
    }
    return authorizedRequest<{}>( "auth/profile/update/", "PUT", formData);
  },
  deleteAccount: (payload: { email: string; password: string }) =>
    authorizedRequest<{}>("auth/delete-account/", "POST", payload),
};
