import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { FaqExplorer } from "@/components/public/FaqExplorer";
import { FaqPageJsonLd } from "@/components/public/JsonLd";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { asList } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { loadSeoDefaults } from "@/lib/public-seo";
import { serverGet } from "@/lib/server-api";
import { generatePageMetadata, routeSeo } from "@/lib/seo";
import type { FAQ } from "@/types/api";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const defaults = await loadSeoDefaults();
  const route = routeSeo(defaults, "faq");
  return generatePageMetadata({ title: route.title, description: route.description, path: "/faq" }, defaults);
}

export default async function FaqPage() {
  let faqs: FAQ[] | null = null;
  let errorMessage: string | null = null;
  try {
    faqs = asList<FAQ>(await serverGet<unknown>("/content/faqs?page_size=100"));
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
    <div className="page-shell page-enter max-w-3xl py-20">
      <FaqPageJsonLd faqs={faqs.map((item) => ({ question: item.question, answer: item.answer }))} />
      <Breadcrumbs items={[{ name: "FAQ", path: "/faq" }]} />
      <p className="eyebrow mt-6">FAQ</p>
      <h1 className="mt-3 text-5xl text-navy">Frequently asked questions</h1>
      <p className="mt-4 text-muted">
        We do not guarantee visa approval. These answers explain how we work with you and should be reviewed against current South African
        immigration requirements before relying on them.
      </p>
      <div className="mt-10">
        {faqs.length === 0 ? <EmptyState title="No questions published" /> : <FaqExplorer faqs={faqs} />}
      </div>
      <div className="mt-12 rounded-[1.4rem] border border-border bg-soft p-6">
        <p className="font-semibold text-navy">Still have a question?</p>
        <p className="mt-2 text-sm text-muted">Book a consultation and we will talk through your circumstances.</p>
        <div className="mt-4">
          <Button href="/book">Book a Consultation</Button>
        </div>
      </div>
    </div>
  );
}
