import type { ReactNode } from "react";

import { MobileCtaBar } from "@/components/public/MobileCtaBar";
import { SiteFooter } from "@/components/public/SiteFooter";
import { SiteHeader } from "@/components/public/SiteHeader";
import { WhatsAppButton } from "@/components/public/WhatsAppButton";
import { brandFromHome, disclaimerFromHome } from "@/lib/content";
import { serverGetOrNull } from "@/lib/server-api";
import type { HomeContent } from "@/types/api";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const home = await serverGetOrNull<HomeContent>("/content/settings/home");
  const emptyHome: HomeContent = {
    settings: {},
    services: [],
    faqs: [],
    testimonials: [],
    featured_articles: [],
  };
  const brand = brandFromHome(home ?? emptyHome);
  const disclaimer = home ? disclaimerFromHome(home) : null;
  return (
    <div className="flex min-h-screen flex-col pb-16 md:pb-0">
      <SiteHeader brand={brand} />
      <main className="flex-1">{children}</main>
      <SiteFooter brand={brand} disclaimer={disclaimer} services={home?.services ?? []} />
      <WhatsAppButton whatsapp={brand.whatsapp} />
      <MobileCtaBar />
    </div>
  );
}
