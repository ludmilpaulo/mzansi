"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/cn";
import type { FAQ } from "@/types/api";

export function FaqAccordion({ faqs }: { faqs: FAQ[] }) {
  const [openId, setOpenId] = useState<number | null>(faqs[0]?.id ?? null);
  return (
    <div className="divide-y divide-border overflow-hidden rounded-[1.4rem] border border-border bg-white shadow-[var(--shadow-card)]">
      {faqs.map((faq) => {
        const open = openId === faq.id;
        return (
          <div key={faq.id}>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              onClick={() => setOpenId(open ? null : faq.id)}
              aria-expanded={open}
            >
              <span className="font-medium text-navy">{faq.question}</span>
              <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted transition", open && "rotate-180")} />
            </button>
            {open ? <p className="px-5 pb-5 text-sm leading-relaxed text-muted">{faq.answer}</p> : null}
          </div>
        );
      })}
    </div>
  );
}
