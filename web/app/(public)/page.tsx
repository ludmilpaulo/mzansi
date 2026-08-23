import type { Metadata } from "next";

import { OrganizationJsonLd, ProfessionalServiceJsonLd, WebSiteJsonLd } from "@/components/public/JsonLd";
import {
  ContactCta,
  FeaturedArticles,
  HomeFaq,
  HomeHeroSection,
  HowItWorksSection,
  PortalCta,
  ServicesGrid,
  TestimonialsSection,
  TrustStrip,
  WhyChooseUs,
} from "@/components/public/HomeSections";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { getErrorMessage } from "@/lib/errors";
import {
  brandFromHome,
  disclaimerFromHome,
  heroFromHome,
  howItWorksFromHome,
  trustFromHome,
  whyChooseFromHome,
} from "@/lib/content";
import { loadSeoDefaults } from "@/lib/public-seo";
import { serverGet } from "@/lib/server-api";
import { generatePageMetadata, parseSeoDefaults, routeSeo } from "@/lib/seo";
import type { HomeContent } from "@/types/api";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const defaults = await loadSeoDefaults();
  try {
    const home = await serverGet<HomeContent>("/content/settings/home");
    const brand = brandFromHome(home);
    const hero = heroFromHome(home);
    const seo = parseSeoDefaults(home.settings.seo);
    const route = routeSeo(seo, "home");
    return generatePageMetadata(
      {
        title: route.title || brand.name,
        description: route.description || hero?.subtitle || brand.tagline,
        path: "/",
        imageUrl: hero?.image_url,
      },
      seo.defaultTitle ? seo : defaults,
    );
  } catch {
    const route = routeSeo(defaults, "home");
    return generatePageMetadata({ title: route.title, description: route.description, path: "/" }, defaults);
  }
}

export default async function HomePage() {
  let home: HomeContent | null = null;
  let errorMessage: string | null = null;
  try {
    home = await serverGet<HomeContent>("/content/settings/home");
  } catch (error) {
    errorMessage = getErrorMessage(error, "The site content could not be loaded. Please try again shortly.");
  }
  if (!home) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24">
        <ErrorState
          description={errorMessage ?? "The site content could not be loaded."}
          action={<Button href="/contact">Contact us</Button>}
        />
      </div>
    );
  }
  const brand = brandFromHome(home);
  const hero = heroFromHome(home);
  const disclaimer = disclaimerFromHome(home);
  return (
    <>
      <OrganizationJsonLd brand={brand} />
      <WebSiteJsonLd brand={brand} />
      <ProfessionalServiceJsonLd brand={brand} />
      {hero ? <HomeHeroSection hero={hero} trust={trustFromHome(home)} /> : null}
      <TrustStrip points={trustFromHome(home)} />
      <ServicesGrid services={home.services} />
      <HowItWorksSection steps={howItWorksFromHome(home)} />
      <PortalCta />
      <WhyChooseUs points={whyChooseFromHome(home)} />
      <TestimonialsSection testimonials={home.testimonials} />
      <HomeFaq faqs={home.faqs} />
      <FeaturedArticles articles={home.featured_articles} />
      <ContactCta brand={brand} />
      {disclaimer ? <p className="mx-auto max-w-6xl px-6 pb-12 text-xs text-muted">{disclaimer.text}</p> : null}
    </>
  );
}
