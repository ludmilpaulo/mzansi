import { cn } from "@/lib/cn";

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <div className={cn("flex items-center justify-center gap-3 text-sm text-muted", className)} role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-brand" />
      <span>{label}</span>
    </div>
  );
}
