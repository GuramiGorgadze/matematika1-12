import { storage } from "./storage.js";

export const TOKEN_KEY = "mx:token";
export const TEACHER_TOKEN_KEY = "mx:teacher-token";

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
  /** no answer from the server at all (offline, server down) */
  get offline() {
    return this.status === 0;
  }
}

function teacherToken() {
  try {
    return sessionStorage.getItem(TEACHER_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * fetch wrapper for the Express API. `as: "teacher"` sends the teacher token,
 * otherwise the student token is used when present.
 */
export async function api(path, { method = "GET", body, as = "student", signal, keepalive } = {}) {
  const headers = { Accept: "application/json" };
  const token = as === "teacher" ? teacherToken() : storage.get(TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(`/api${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), signal, keepalive });
  } catch (e) {
    if (e?.name === "AbortError") throw e;
    throw new ApiError(0, "offline", "სერვერთან კავშირი ვერ დამყარდა. შეამოწმე ინტერნეტი.");
  }
  const type = res.headers.get("content-type") || "";
  const data = type.includes("application/json") ? await res.json().catch(() => null) : null;
  if (!res.ok) {
    const err = data?.error || {};
    throw new ApiError(res.status, err.code || "http_error", err.message || `შეცდომა (${res.status})`, err.details);
  }
  return data;
}

/** download a protected file (teacher CSV exports) */
export async function download(path, filename) {
  const res = await fetch(`/api${path}`, { headers: { Authorization: `Bearer ${teacherToken()}` } });
  if (!res.ok) throw new ApiError(res.status, "download_failed", "ფაილის ჩამოტვირთვა ვერ მოხერხდა.");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
