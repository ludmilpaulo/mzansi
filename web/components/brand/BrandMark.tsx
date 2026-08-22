import Link from "next/link";

import { cn } from "@/lib/cn";

function splitBrandName(name: string): { lead: string; rest: string } {
  const parts = name.trim().split(/\s+/);
  const lead = parts[0] ?? name;
  return { lead, rest: parts.slice(1).join(" ") };
}

export function BrandMark({
  name,
  href = "/",
  invert = false,
  compact = false,
}: {
  name: string;
  href?: string;
  invert?: boolean;
  compact?: boolean;
}) {
  const { lead, rest } = splitBrandName(name);
  return (
    <Link href={href} className="inline-flex min-w-0 items-center gap-3">
      <span
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-[0_10px_24px_rgba(255,107,33,0.32)]",
          invert ? "bg-brand" : "bg-brand",
        )}
        aria-hidden
      >
        <svg viewBox="0 0 32 32" className="h-5 w-5" fill="none">
          <path d="M4 22.5 16 7l12 15.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 22.5h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="16" cy="16" r="2.1" fill="currentColor" />
        </svg>
      </span>
      {compact ? (
        <span className="sr-only">{name}</span>
      ) : (
        <span className="min-w-0">
          <span className={cn("block truncate font-serif text-[1.35rem] leading-none", invert ? "text-white" : "text-navy")}>
            {lead}
          </span>
          {rest ? (
            <span
              className={cn(
                "mt-1 block truncate text-[0.68rem] font-medium uppercase tracking-[0.16em]",
                invert ? "text-white/55" : "text-muted",
              )}
            >
              {rest}
            </span>
          ) : null}
        </span>
      )}
    </Link>
  );
}
