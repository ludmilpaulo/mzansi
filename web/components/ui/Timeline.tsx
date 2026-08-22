import { formatDateTime } from "@/lib/dates";
import type { TimelineEvent } from "@/types/api";

export function Timeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted">No timeline events yet.</p>;
  }
  return (
    <ol className="space-y-5">
      {events.map((event, index) => (
        <li key={event.id} className="flex gap-4">
          <div className="flex flex-col items-center">
            <span className="mt-1 h-3 w-3 rounded-full bg-brand" />
            {index < events.length - 1 ? <span className="mt-1 w-px flex-1 bg-border" /> : null}
          </div>
          <div className="pb-2">
            <p className="text-sm font-medium text-navy">{event.title}</p>
            <p className="mt-1 text-sm text-muted">{event.description}</p>
            <p className="mt-2 text-xs text-muted">
              {formatDateTime(event.occurred_at)}
              {event.staff_name ? ` · ${event.staff_name}` : ""}
              {event.client_action_required ? " · Action required" : ""}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
