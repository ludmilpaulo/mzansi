"use client";

import { useMemo, useState } from "react";

import { FaqAccordion } from "@/components/public/FaqAccordion";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import type { FAQ } from "@/types/api";

const CATEGORY_LABELS: Record<string, string> = {
  general: "General",
  work: "Work Visas",
  "permanent-residence": "Permanent Residence",
  visitor: "Visitor Visas",
  study: "Study Visas",
  family: "Family",
  business: "Business",
  waivers: "Waivers",
  documents: "Documents",
  tracking: "Tracking",
  consultations: "Consultations",
  portal: "Client Portal",
  fees: "Fees",
};

function labelFor(category: string): string {
  return CATEGORY_LABELS[category] ?? category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function FaqExplorer({ faqs }: { faqs: FAQ[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");

  const categories = useMemo(() => {
    const unique = Array.from(new Set(faqs.map((item) => item.category))).sort();
    return unique;
  }, [faqs]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return faqs.filter((item) => {
      if (category !== "all" && item.category !== category) {
        return false;
      }
      if (!needle) {
        return true;
      }
      return item.question.toLowerCase().includes(needle) || item.answer.toLowerCase().includes(needle);
    });
  }, [faqs, query, category]);

  return (
    <div className="space-y-8">
      <Input
        label="Search FAQs"
        placeholder="Search immigration questions…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory("all")}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold",
            category === "all" ? "bg-brand text-white" : "bg-soft text-muted hover:text-navy",
          )}
        >
          All
        </button>
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setCategory(item)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold",
              category === item ? "bg-brand text-white" : "bg-soft text-muted hover:text-navy",
            )}
          >
            {labelFor(item)}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="No matching questions" description="Try another search term or category." />
      ) : (
        <FaqAccordion faqs={filtered} key={`${category}:${query}`} />
      )}
    </div>
  );
}
