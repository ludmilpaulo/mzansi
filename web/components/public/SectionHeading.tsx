import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  invert = false,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  align?: "left" | "center";
  invert?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      {eyebrow ? <p className={cn("eyebrow", invert && "text-brand")}>{eyebrow}</p> : null}
      <h2 className={cn("mt-3 font-display text-4xl md:text-[2.65rem] md:leading-tight", invert ? "text-white" : "text-navy")}>
        {title}
      </h2>
      {description ? (
        <p className={cn("mt-4 text-base leading-relaxed", invert ? "text-white/65" : "text-muted")}>{description}</p>
      ) : null}
    </div>
  );
}
