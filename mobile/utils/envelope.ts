import type {
  ApiErrorBody,
  ApiFailure,
  ApiSuccess,
  FieldErrors,
  JsonObject,
  JsonValue,
  Paginated,
} from "../types/api";

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

export function unwrapList<T>(value: unknown): T[] {
  const data = unwrapEnvelope<unknown>(value);
  if (isPaginated<T>(data)) {
    return data.results;
  }
  if (Array.isArray(data)) {
    return data as T[];
  }
  throw new Error("Expected a list response.");
}

export function unwrapPage<T>(value: unknown): Paginated<T> {
  const data = unwrapEnvelope<unknown>(value);
  if (isPaginated<T>(data)) {
    return data;
  }
  if (Array.isArray(data)) {
    return { count: data.length, next: null, previous: null, results: data as T[] };
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

export function parseBrandSettings(value: unknown): {
  name: string;
  tagline: string;
  primary_color: string;
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
  social: { linkedin: string; facebook: string; instagram: string };
} | null {
  if (!isJsonObject(value)) {
    return null;
  }
  const socialValue = value.social;
  const social = isJsonObject(socialValue) ? socialValue : {};
  return {
    name: readString(value.name, "Mzansi Visa Solutions"),
    tagline: readString(value.tagline),
    primary_color: readString(value.primary_color, "#FF6B21"),
    phone: readString(value.phone),
    email: readString(value.email),
    address: readString(value.address),
    whatsapp: readString(value.whatsapp),
    social: {
      linkedin: readString(social.linkedin),
      facebook: readString(social.facebook),
      instagram: readString(social.instagram),
    },
  };
}
