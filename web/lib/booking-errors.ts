import type { AppointmentSlot } from "@/types/api";

function isRecord(value: unknown): value is { [key: string]: unknown } {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getSlotAlternatives(error: unknown): AppointmentSlot[] {
  if (!isRecord(error) || !("data" in error) || !isRecord(error.data)) {
    return [];
  }
  const data = error.data;
  if (!Array.isArray(data.alternatives)) {
    return [];
  }
  return data.alternatives.filter(isAppointmentSlot);
}

export function isSlotUnavailable(error: unknown): boolean {
  if (!isRecord(error) || !("data" in error) || !isRecord(error.data)) {
    return false;
  }
  return error.data.code === "SLOT_UNAVAILABLE";
}

function isAppointmentSlot(value: unknown): value is AppointmentSlot {
  return isRecord(value) && typeof value.starts_at === "string" && typeof value.ends_at === "string";
}
