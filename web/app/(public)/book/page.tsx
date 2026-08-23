import type { Metadata } from "next";

import { PublicBookingWizard } from "@/components/forms/PublicBookingWizard";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { loadSeoDefaults } from "@/lib/public-seo";
import { generatePageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const defaults = await loadSeoDefaults();
  return generatePageMetadata(
    {
      title: "Book a Consultation | Mzansi Visa Solutions",
      description:
        "Book an immigration consultation without creating an account first. Secure confirmation and optional client portal activation.",
      path: "/book",
    },
    defaults,
  );
}

export default function BookConsultationPage() {
  return (
    <div className="page-shell page-enter max-w-3xl py-16 sm:py-20">
      <Breadcrumbs items={[{ name: "Book consultation", path: "/book" }]} />
      <p className="eyebrow mt-6">Consultation</p>
      <h1 className="mt-3 text-4xl text-navy sm:text-5xl">Book a consultation</h1>
      <p className="mt-4 max-w-2xl text-muted">
        No login required. Choose a time, share your contact details, and receive confirmation by email. If you are new, we will send a
        secure link so you can set your own password.
      </p>
      <div className="mt-10">
        <PublicBookingWizard />
      </div>
      <p className="mt-8 text-xs leading-relaxed text-muted">
        Mzansi Visa Solutions provides professional immigration assistance and administrative support. Immigration decisions are made by the
        relevant South African government authorities. No visa, permit, waiver or permanent residence outcome can be guaranteed.
      </p>
    </div>
  );
}
