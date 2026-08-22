import type { ReactNode } from "react";

import { SiteFooter } from "@/components/public/SiteFooter";
import { SiteHeader } from "@/components/public/SiteHeader";
import { brandFromHome, disclaimerFromHome } from "@/lib/content";
import { serverGetOrNull } from "@/lib/server-api";
import type { HomeContent } from "@/types/api";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const home = await serverGetOrNull<HomeContent>("/content/settings/home");
  const brand = home ? brandFromHome(home) : brandFromHome({ settings: {}, services: [], faqs: [], testimonials: [], featured_articles: [] });
  const disclaimer = home ? disclaimerFromHome(home) : null;
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader brand={brand} />
      <main className="flex-1">{children}</main>
      <SiteFooter brand={brand} disclaimer={disclaimer} />
    </div>
  );
}
