"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/cn";
import type { FAQ } from "@/types/api";

export function FaqAccordion({ faqs }: { faqs: FAQ[] }) {
  const [openId, setOpenId] = useState<number | null>(faqs[0]?.id ?? null);
  return (
    <div className="space-y-3">
      {faqs.map((faq) => {
        const open = openId === faq.id;
        const panelId = `faq-panel-${faq.id}`;
        return (
          <div key={faq.id} className="overflow-hidden rounded-[1.15rem] border border-border bg-white shadow-[var(--shadow-card)]">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              onClick={() => setOpenId(open ? null : faq.id)}
              aria-expanded={open}
              aria-controls={panelId}
            >
              <span className="font-semibold text-navy">{faq.question}</span>
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-brand transition", open && "rotate-180")} />
            </button>
            {open ? (
              <p id={panelId} className="px-5 pb-5 text-sm leading-relaxed text-muted">
                {faq.answer}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
