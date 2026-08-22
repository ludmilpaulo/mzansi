import { readApiError } from "./envelope";

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

export function getFieldError(error: unknown, field: string): string | undefined {
  if (!isRecord(error) || !("data" in error)) {
    return undefined;
  }
  const body = readApiError(error.data);
  const messages = body.fields?.[field];
  return messages?.[0];
}
