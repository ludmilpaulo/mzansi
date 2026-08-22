import type { Role, User } from "@/types/api";

export const AUTH_STORAGE_KEY = "mzansi.auth";
export const ROLE_COOKIE = "mzansi.role";

export interface StoredAuth {
  access: string;
  refresh: string;
  user: User | null;
}

function isRecord(value: unknown): value is { [key: string]: unknown } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRole(value: unknown): value is Role {
  return (
    value === "SUPER_ADMIN" ||
    value === "ADMIN" ||
    value === "CONSULTANT" ||
    value === "DOCUMENT_REVIEWER" ||
    value === "FINANCE" ||
    value === "SUPPORT" ||
    value === "CLIENT"
  );
}

function isUser(value: unknown): value is User {
  if (!isRecord(value) || typeof value.id !== "number" || typeof value.email !== "string") {
    return false;
  }
  return isRole(value.role);
}

export function readStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") {
    return null;
  }
  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || typeof parsed.access !== "string" || typeof parsed.refresh !== "string") {
      return null;
    }
    return {
      access: parsed.access,
      refresh: parsed.refresh,
      user: isUser(parsed.user) ? parsed.user : null,
    };
  } catch {
    return null;
  }
}

export function writeStoredAuth(payload: StoredAuth): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
  writeRoleCookie(payload.user?.role ?? null);
}

export function clearStoredAuth(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  writeRoleCookie(null);
}

export function writeRoleCookie(role: Role | null): void {
  if (typeof document === "undefined") {
    return;
  }
  if (!role) {
    document.cookie = `${ROLE_COOKIE}=; Path=/; SameSite=Lax; Max-Age=0`;
    return;
  }
  document.cookie = `${ROLE_COOKIE}=${encodeURIComponent(role)}; Path=/; SameSite=Lax; Max-Age=2592000`;
}
