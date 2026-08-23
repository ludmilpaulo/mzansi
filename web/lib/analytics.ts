export type AnalyticsEventName =
  | "consultation_started"
  | "consultation_completed"
  | "application_started"
  | "application_completed"
  | "contact_submitted"
  | "phone_clicked"
  | "whatsapp_clicked"
  | "document_started"
  | "client_registered";

export interface AnalyticsEvent {
  name: AnalyticsEventName;
  path?: string;
  service?: string;
}

interface DataLayerWindow extends Window {
  dataLayer?: Array<{ event: string; [key: string]: string }>;
}

function analyticsWindow(): DataLayerWindow | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window;
}

export function trackEvent(event: AnalyticsEvent): void {
  const target = analyticsWindow();
  if (!target) {
    return;
  }
  const payload: { event: string; [key: string]: string } = { event: event.name };
  if (event.path) {
    payload.path = event.path;
  }
  if (event.service) {
    payload.service = event.service;
  }
  target.dataLayer = target.dataLayer ?? [];
  target.dataLayer.push(payload);
}
