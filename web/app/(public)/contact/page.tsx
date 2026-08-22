import type { Metadata } from "next";

import { ContactForms } from "@/app/(public)/contact/ContactForms";
import { brandFromHome } from "@/lib/content";
import { cmsMetadata } from "@/lib/cms-page";
import { serverGetOrNull } from "@/lib/server-api";
import type { CmsPage, HomeContent } from "@/types/api";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return cmsMetadata("contact")();
}

export default async function ContactPage() {
  const [page, home] = await Promise.all([
    serverGetOrNull<CmsPage>("/content/pages/contact"),
    serverGetOrNull<HomeContent>("/content/settings/home"),
  ]);
  const brand = home ? brandFromHome(home) : brandFromHome({ settings: {}, services: [], faqs: [], testimonials: [], featured_articles: [] });
  return (
    <div className="page-shell py-20">
      <div className="max-w-2xl">
        <p className="eyebrow">Consultation</p>
        <h1 className="mt-3 font-serif text-5xl text-navy md:text-6xl">{page?.title ?? "Contact"}</h1>
        <p className="mt-4 text-lg text-muted">{page?.body ?? page?.excerpt}</p>
        <p className="mt-6 text-sm text-charcoal">
          {brand.address}
          {brand.phone ? ` · ${brand.phone}` : ""}
          {brand.email ? ` · ${brand.email}` : ""}
        </p>
      </div>
      <ContactForms />
    </div>
  );
}
