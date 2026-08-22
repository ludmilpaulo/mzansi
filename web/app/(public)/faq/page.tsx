import type { Metadata } from "next";

import { FaqAccordion } from "@/components/public/FaqAccordion";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { asList } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { serverGet } from "@/lib/server-api";
import type { FAQ } from "@/types/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers about consultations, documents, and how Mzansi Visa Solutions works with you.",
};

export default async function FaqPage() {
  let faqs: FAQ[] | null = null;
  let errorMessage: string | null = null;
  try {
    faqs = asList<FAQ>(await serverGet<unknown>("/content/faqs"));
  } catch (error) {
    errorMessage = getErrorMessage(error);
  }
  if (!faqs) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <ErrorState description={errorMessage ?? "FAQs could not be loaded."} />
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="font-serif text-5xl text-navy">Frequently asked questions</h1>
      <p className="mt-4 text-muted">We do not guarantee visa approval. These answers explain how we work with you.</p>
      <div className="mt-10">
        {faqs.length === 0 ? <EmptyState title="No questions published" /> : <FaqAccordion faqs={faqs} />}
      </div>
    </div>
  );
}
