import { cn } from "@/lib/cn";
import type { TrackingJourneyStep } from "@/types/api";

export function TrackingJourney({ steps }: { steps: TrackingJourneyStep[] }) {
  return (
    <ol className="space-y-0">
      {steps.map((step, index) => {
        const complete = step.state === "complete";
        const current = step.state === "current";
        return (
          <li key={step.code} className="flex gap-4">
            <div className="flex w-6 flex-col items-center">
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                  complete && "bg-emerald-600 text-white",
                  current && "bg-brand text-white",
                  step.state === "upcoming" && "bg-slate-200 text-slate-500",
                )}
              >
                {complete ? "✓" : current ? "●" : "○"}
              </span>
              {index < steps.length - 1 ? <span className="my-1 w-px flex-1 bg-border" /> : null}
            </div>
            <div className={cn("pb-6", index === steps.length - 1 && "pb-0")}>
              <p className={cn("text-sm font-medium", current ? "text-navy" : "text-charcoal")}>{step.label}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
