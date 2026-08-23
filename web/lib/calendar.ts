/** Build a simple .ics download for a confirmed consultation. */
export function downloadConsultationIcs(input: {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  reference: string;
}): void {
  const start = toIcsUtc(input.startsAt);
  const end = toIcsUtc(input.endsAt);
  if (!start || !end) {
    return;
  }
  const stamp = toIcsUtc(new Date().toISOString()) ?? start;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Mzansi Visa Solutions//Consultation//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${input.reference}@mzansivisa`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${escapeIcs(input.title)}`,
    `DESCRIPTION:${escapeIcs(input.description)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${input.reference}.ics`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function toIcsUtc(value: string): string | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function escapeIcs(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
