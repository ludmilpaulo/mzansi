import type { Metadata } from "next";

import { OrganizationJsonLd, ProfessionalServiceJsonLd, WebSiteJsonLd } from "@/components/public/JsonLd";
import { PathwayFinder } from "@/components/public/PathwayFinder";
import {
  ContactCta,
  FeaturedArticles,
  HomeFaq,
  HomeHeroSection,
  HowItWorksSection,
  InternationalSection,
  PortalCta,
  ServicesGrid,
  TestimonialsSection,
  TrackingSection,
  TrustStrip,
  WhyChooseUs,
} from "@/components/public/HomeSections";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { getErrorMessage } from "@/lib/errors";
import {
  brandFromHome,
  consultationCtaFromHome,
  disclaimerFromHome,
  featuredServicesFromHome,
  heroFromHome,
  howItWorksFromHome,
  internationalFromHome,
  knowledgeHubFromHome,
  pathwayFromHome,
  portalCtaFromHome,
  trackingCtaFromHome,
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
  const pathway = pathwayFromHome(home);
  return (
    <div className="page-enter">
      <OrganizationJsonLd brand={brand} />
      <WebSiteJsonLd brand={brand} />
      <ProfessionalServiceJsonLd brand={brand} />
      {hero ? <HomeHeroSection hero={hero} trust={trustFromHome(home)} /> : null}
      <TrustStrip points={trustFromHome(home)} />
      <ServicesGrid services={home.services} config={featuredServicesFromHome(home)} />
      {pathway ? <PathwayFinder guidance={pathway} /> : null}
      <HowItWorksSection steps={howItWorksFromHome(home)} />
      <PortalCta content={portalCtaFromHome(home)} />
      <TrackingSection content={trackingCtaFromHome(home)} />
      <WhyChooseUs points={whyChooseFromHome(home)} />
      <InternationalSection content={internationalFromHome(home)} landings={home.country_landings ?? []} />
      <FeaturedArticles articles={home.featured_articles} hub={knowledgeHubFromHome(home)} />
      <TestimonialsSection testimonials={home.testimonials} />
      <HomeFaq faqs={home.faqs} />
      <ContactCta brand={brand} content={consultationCtaFromHome(home)} />
      {disclaimer ? (
        <p className="page-shell pb-12 pt-6 text-xs leading-relaxed text-muted">{disclaimer.text}</p>
      ) : null}
    </div>
  );
}
