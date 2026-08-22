import { readApiError } from "@/lib/api";
import type { FieldErrors } from "@/types/api";

function isRecord(value: unknown): value is { [key: string]: unknown } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (!error) {
    return fallback;
  }
  if (typeof error === "string" && error.trim()) {
    return error;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  if (isRecord(error)) {
    if ("data" in error) {
      return readApiError(error.data).detail || fallback;
    }
    if ("error" in error) {
      return readApiError(error).detail || fallback;
    }
    if (typeof error.message === "string" && error.message.trim()) {
      return error.message;
    }
  }
  return fallback;
}

export function getFieldErrors(error: unknown): FieldErrors | undefined {
  if (!isRecord(error) || !("data" in error)) {
    return undefined;
  }
  return readApiError(error.data).fields;
}

export function getFieldError(error: unknown, field: string): string | undefined {
  const messages = getFieldErrors(error)?.[field];
  return messages?.[0];
}
