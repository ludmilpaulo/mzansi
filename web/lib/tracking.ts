import { isJsonObject, readNumber, readString } from "@/lib/api";
import type { ExternalTrackingSettings, JsonValue, TrackingStatus } from "@/types/api";

const DEFAULT_FALLBACK = "https://visa.vfsglobal.com/zaf/en/dha/track-application";

export function parseExternalTrackingSettings(value: JsonValue | undefined): ExternalTrackingSettings {
  if (!isJsonObject(value)) {
    return {
      provider: "VFS",
      automatic_tracking: false,
      automatic_check_interval_hours: 6,
      manual_refresh_cooldown_minutes: 30,
      fallback_url: DEFAULT_FALLBACK,
      store_raw_status: false,
      status_mapping: {},
    };
  }
  const mappingValue = value.status_mapping;
  const status_mapping: Record<string, TrackingStatus | string> = {};
  if (isJsonObject(mappingValue)) {
    for (const [key, item] of Object.entries(mappingValue)) {
      if (typeof item === "string") {
        status_mapping[key] = item;
      }
    }
  }
  return {
    provider: readString(value.provider, "VFS"),
    automatic_tracking: value.automatic_tracking === true,
    automatic_check_interval_hours: readNumber(value.automatic_check_interval_hours, 6),
    manual_refresh_cooldown_minutes: readNumber(value.manual_refresh_cooldown_minutes, 30),
    fallback_url: readString(value.fallback_url, DEFAULT_FALLBACK),
    store_raw_status: value.store_raw_status === true,
    status_mapping,
  };
}

export function trackingTone(status: string | null | undefined): "success" | "warning" | "info" | "neutral" {
  if (status === "READY_FOR_COLLECTION" || status === "DECISION_RETURNED") {
    return "success";
  }
  if (status === "APPLICATION_UNDER_PROCESS") {
    return "info";
  }
  if (status === "UNKNOWN") {
    return "warning";
  }
  return "neutral";
}
