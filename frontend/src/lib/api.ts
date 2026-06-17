const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:5001";

export type Role = "ADMIN" | "VOLUNTEER";
export type Session = "SESSION_1" | "SESSION_2";

export type ValidationStatus =
  | "SUCCESS"
  | "FAILED_DUPLICATE"
  | "FAILED_REVOKED"
  | "FAILED_INVALID"
  | "FAILED_WRONG_SESSION";

export interface ApiError {
  status: number;
  message: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });
  } catch {
    throw {
      status: 0,
      message: "Cannot reach the server. Is the backend running on " + API_URL + "?",
    } as ApiError;
  }

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    /* no body */
  }

  if (!res.ok) {
    throw {
      status: res.status,
      message: body?.error || body?.message || `Request failed (${res.status})`,
    } as ApiError;
  }

  return body as T;
}

// ---- Auth ----
export function login(email: string, password: string) {
  return request<{ success: boolean; message: string; role: Role }>(
    "/api/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) }
  );
}

export function logout() {
  return request<{ success: boolean }>("/api/auth/logout", { method: "POST" });
}

// ---- Admin: Ticket generation ----
export function generateTicket(userId: string, session: Session) {
  return request<{
    success: boolean;
    message: string;
    data: { ticketId: string; qrCode: string; qrToken: string };
  }>("/api/qr/generate", {
    method: "POST",
    body: JSON.stringify({ userId, session }),
  });
}

export function revokeTicket(ticketId: string) {
  return request<{ success: boolean; message: string }>(
    "/api/qr/admin/ticket/revoke",
    { method: "PATCH", body: JSON.stringify({ ticketId }) }
  );
}

export function getAttendance() {
  return request<{
    success: boolean;
    data: { _id: Session; count: number }[];
  }>("/api/qr/admin/attendance", { method: "GET" });
}

// ---- Validation (Admin + Volunteer) ----
export interface ValidationResult {
  success: boolean;
  status: ValidationStatus;
  message: string;
  ticket?: {
    ticketId: string;
    userId: string;
    session: Session;
    checkedInAt?: string;
  };
}

// The backend returns HTTP 403 (with a meaningful body) for failed scans such as
// duplicate / revoked / wrong-session. We treat those as normal results, not errors.
export async function validateScan(
  qrToken: string,
  currentScanningSession: Session
): Promise<ValidationResult> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/qr/validate`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ qrToken, currentScanningSession }),
    });
  } catch {
    throw {
      status: 0,
      message: "Cannot reach the server. Is the backend running on " + API_URL + "?",
    } as ApiError;
  }

  const body = await res.json().catch(() => null);

  // 401 = not logged in, 500 = server error -> surface as a real error
  if (res.status === 401 || res.status >= 500 || !body) {
    throw {
      status: res.status,
      message: body?.error || body?.message || `Validation failed (${res.status})`,
    } as ApiError;
  }

  return body as ValidationResult;
}
