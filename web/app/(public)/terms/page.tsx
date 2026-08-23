import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { getErrorMessage } from "@/lib/errors";
import { loadSeoDefaults } from "@/lib/public-seo";
import { serverGet } from "@/lib/server-api";
import { generatePageMetadata } from "@/lib/seo";
import type { CurrentTermsDocument } from "@/types/api";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const defaults = await loadSeoDefaults();
  return generatePageMetadata(
    {
      title: "Terms & Conditions | Mzansi Visa Solutions",
      description: "Terms and conditions for immigration consultation and client portal services.",
      path: "/terms",
    },
    defaults,
  );
}

export default async function TermsPage() {
  let terms: CurrentTermsDocument | null = null;
  let errorMessage: string | null = null;
  try {
    terms = await serverGet<CurrentTermsDocument>("/public/legal/terms/current");
  } catch (error) {
    errorMessage = getErrorMessage(error);
  }

  if (!terms) {
    return (
      <div className="page-shell py-20">
        <ErrorState description={errorMessage ?? "Terms could not be loaded."} />
      </div>
    );
  }

  if (!terms.body) {
    return (
      <div className="page-shell py-20">
        <EmptyState title="Terms being prepared" description={terms.summary || "Please check back soon."} />
      </div>
    );
  }

  return (
    <div className="page-shell page-enter max-w-3xl py-16 sm:py-20">
      <Breadcrumbs items={[{ name: "Terms & Conditions", path: "/terms" }]} />
      <p className="eyebrow mt-6">Legal</p>
      <h1 className="mt-3 text-4xl text-navy sm:text-5xl">{terms.title}</h1>
      <p className="mt-4 text-sm text-muted">
        Version {terms.version}
        {terms.effective_date ? ` · Effective ${terms.effective_date}` : ""}
      </p>
      {terms.summary ? <p className="mt-4 text-muted">{terms.summary}</p> : null}
      <div className="prose-legal mt-10 whitespace-pre-wrap text-[15px] leading-relaxed text-charcoal">{terms.body}</div>
      <p className="mt-10 rounded-2xl border border-border bg-soft p-5 text-sm text-muted">
        These terms are provided for operational clarity and should be reviewed by a South African-qualified legal professional before
        publication as final client terms. See also our{" "}
        <Link href="/privacy" className="font-medium text-brand">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
