import type {
  ApiErrorBody,
  ApiFailure,
  ApiSuccess,
  FieldErrors,
  JsonObject,
  JsonValue,
  Paginated,
} from "@/types/api";

const LOCAL_API_BASE_URL = "http://127.0.0.1:8000/api/v1";
const PRODUCTION_API_BASE_URL = "https://kudya.pythonanywhere.com/api/v1";

export function getApiBaseUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim().replace(/\/$/, "");
  if (configured && /^https?:\/\//i.test(configured)) {
    return configured;
  }
  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_API_BASE_URL;
  }
  return LOCAL_API_BASE_URL;
}

export function getSiteUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/$/, "");
  if (configured && /^https?:\/\//i.test(configured)) {
    return configured;
  }
  if (process.env.NODE_ENV === "production") {
    return "https://mzansi-pi.vercel.app";
  }
  return "http://127.0.0.1:3000";
}

function isRecord(value: unknown): value is { [key: string]: unknown } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isFieldErrors(value: unknown): value is FieldErrors {
  if (!isRecord(value)) {
    return false;
  }
  return Object.values(value).every(isStringArray);
}

export function isApiSuccess<T>(value: unknown): value is ApiSuccess<T> {
  return isRecord(value) && value.success === true && "data" in value;
}

export function isApiFailure(value: unknown): value is ApiFailure {
  if (!isRecord(value) || value.success !== false || !isRecord(value.error)) {
    return false;
  }
  const error = value.error;
  return typeof error.code === "string" && typeof error.detail === "string";
}

export function unwrapEnvelope<T>(value: unknown): T {
  if (isApiSuccess<T>(value)) {
    return value.data;
  }
  if (isApiFailure(value)) {
    throw new Error(value.error.detail);
  }
  throw new Error("Unexpected API response.");
}

export function isPaginated<T>(value: unknown): value is Paginated<T> {
  if (!isRecord(value) || !Array.isArray(value.results) || typeof value.count !== "number") {
    return false;
  }
  return (value.next === null || typeof value.next === "string") && (value.previous === null || typeof value.previous === "string");
}

function asTypedArray<T>(value: unknown[]): T[] {
  return value as T[];
}

export function unwrapList<T>(value: unknown): T[] {
  const data = unwrapEnvelope<unknown>(value);
  return asList<T>(data);
}

export function asList<T>(data: unknown): T[] {
  if (isPaginated<T>(data)) {
    return data.results;
  }
  if (Array.isArray(data)) {
    return asTypedArray<T>(data);
  }
  throw new Error("Expected a list response.");
}

export function unwrapPage<T>(value: unknown): Paginated<T> {
  const data = unwrapEnvelope<unknown>(value);
  return asPage<T>(data);
}

export function asPage<T>(data: unknown): Paginated<T> {
  if (isPaginated<T>(data)) {
    return data;
  }
  if (Array.isArray(data)) {
    const results = asTypedArray<T>(data);
    return { count: results.length, next: null, previous: null, results };
  }
  throw new Error("Expected a paginated response.");
}

export function readApiError(value: unknown): ApiErrorBody {
  if (isApiFailure(value)) {
    return {
      code: value.error.code,
      detail: value.error.detail,
      fields: value.error.fields && isFieldErrors(value.error.fields) ? value.error.fields : undefined,
    };
  }
  if (isRecord(value) && isRecord(value.error)) {
    const error = value.error;
    if (typeof error.detail === "string") {
      return {
        code: typeof error.code === "string" ? error.code : "error",
        detail: error.detail,
        fields: isFieldErrors(error.fields) ? error.fields : undefined,
      };
    }
  }
  if (isRecord(value) && typeof value.detail === "string") {
    return { code: "error", detail: value.detail };
  }
  return { code: "error", detail: "Request failed." };
}

export function isJsonObject(value: unknown): value is JsonObject {
  if (!isRecord(value)) {
    return false;
  }
  return Object.values(value).every((item) => isJsonValue(item));
}

export function isJsonValue(value: unknown): value is JsonValue {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }
  return isJsonObject(value);
}

export function readString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function readNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
