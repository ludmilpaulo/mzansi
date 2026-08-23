"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import type { PathwayGuidance } from "@/lib/content";

export function PathwayFinder({ guidance }: { guidance: PathwayGuidance }) {
  const router = useRouter();
  const [selected, setSelected] = useState(guidance.options[0]?.href ?? "");

  return (
    <section className="page-shell py-20" aria-labelledby="pathway-heading">
      <div className="overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-[var(--shadow-card)]">
        <div className="grid lg:grid-cols-[1.1fr_1fr]">
          <div className="bg-navy px-8 py-12 text-white md:px-12">
            <p className="eyebrow text-brand">Initial guidance</p>
            <h2 id="pathway-heading" className="mt-3 max-w-md text-3xl md:text-4xl">
              {guidance.title}
            </h2>
            {guidance.body ? <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/70">{guidance.body}</p> : null}
            {guidance.disclaimer ? (
              <p className="mt-8 max-w-lg text-xs leading-relaxed text-white/45">{guidance.disclaimer}</p>
            ) : null}
          </div>
          <form
            className="px-8 py-12 md:px-12"
            onSubmit={(event) => {
              event.preventDefault();
              if (selected) {
                router.push(selected);
              }
            }}
          >
            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold text-navy">What are you planning to do in South Africa?</legend>
              {guidance.options.map((option) => {
                const id = `pathway-${option.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
                return (
                  <label
                    key={option.label}
                    htmlFor={id}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm text-charcoal transition hover:border-brand/50 has-[:checked]:border-brand has-[:checked]:bg-soft"
                  >
                    <input
                      id={id}
                      type="radio"
                      name="pathway"
                      value={option.href}
                      checked={selected === option.href}
                      onChange={() => setSelected(option.href)}
                      className="h-4 w-4 accent-[var(--color-brand)]"
                    />
                    {option.label}
                  </label>
                );
              })}
            </fieldset>
            <div className="mt-8">
              <Button type="submit" disabled={!selected}>
                {guidance.continue_label}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
