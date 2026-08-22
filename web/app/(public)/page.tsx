import type { Metadata } from "next";

import { ProfessionalServiceJsonLd } from "@/components/public/JsonLd";
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
import { serverGet } from "@/lib/server-api";
import type { HomeContent } from "@/types/api";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  try {
    const home = await serverGet<HomeContent>("/content/settings/home");
    const brand = brandFromHome(home);
    const hero = heroFromHome(home);
    return {
      title: brand.name,
      description: hero?.subtitle || brand.tagline,
      openGraph: {
        title: hero?.title || brand.name,
        description: hero?.subtitle || brand.tagline,
        images: hero?.image_url ? [{ url: hero.image_url }] : undefined,
      },
    };
  } catch {
    return { title: "Mzansi Visa Solutions" };
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
