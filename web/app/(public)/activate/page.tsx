import type { Metadata } from "next";

import { ActivateForm } from "@/components/forms/ActivateForm";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { loadSeoDefaults } from "@/lib/public-seo";
import { generatePageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const defaults = await loadSeoDefaults();
  return generatePageMetadata(
    {
      title: "Activate Client Account | Mzansi Visa Solutions",
      description: "Activate your Mzansi Visa Solutions client account and create a secure password.",
      path: "/activate",
      noIndex: true,
    },
    defaults,
  );
}

export default function ActivatePage() {
  return (
    <div className="page-shell page-enter max-w-lg py-16 sm:py-20">
      <Breadcrumbs items={[{ name: "Activate account", path: "/activate" }]} />
      <p className="eyebrow mt-6">Client portal</p>
      <h1 className="mt-3 text-4xl text-navy">Activate your account</h1>
      <p className="mt-4 text-muted">
        Use the secure link from your email, then create your own password. We never email permanent passwords.
      </p>
      <div className="mt-10">
        <ActivateForm />
      </div>
    </div>
  );
}
