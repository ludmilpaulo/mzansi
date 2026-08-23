import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LandingView } from "@/components/public/LandingView";
import { ErrorState } from "@/components/ui/ErrorState";
import { asList } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { loadSeoDefaults } from "@/lib/public-seo";
import { serverGet, serverGetOrNull } from "@/lib/server-api";
import { metadataFromSeoFields } from "@/lib/seo";
import type { ArticleList, SeoLandingDetail, ServiceList } from "@/types/api";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const defaults = await loadSeoDefaults();
  try {
    const landing = await serverGet<SeoLandingDetail>(`/content/landings/${slug}`);
    if (landing.kind !== "country") {
      return { title: "Not found", robots: { index: false, follow: false } };
    }
    return metadataFromSeoFields(
      landing,
      { title: landing.title, description: landing.excerpt, path: `/countries/${slug}` },
      defaults,
    );
  } catch {
    return { title: "Country guide", robots: { index: false, follow: false } };
  }
}

export default async function CountryLandingPage({ params }: Params) {
  const { slug } = await params;
  let landing: SeoLandingDetail | null = null;
  let errorMessage: string | null = null;
  try {
    landing = await serverGet<SeoLandingDetail>(`/content/landings/${slug}`);
  } catch (error) {
    errorMessage = getErrorMessage(error);
  }
  if (!landing || landing.kind !== "country") {
    if (errorMessage?.toLowerCase().includes("not found") || (landing && landing.kind !== "country")) {
      notFound();
    }
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <ErrorState description={errorMessage ?? "This guide could not be loaded."} />
      </div>
    );
  }
  const [servicesPayload, articlesPayload] = await Promise.all([
    serverGetOrNull<unknown>("/services"),
    serverGetOrNull<unknown>("/content/articles"),
  ]);
  return (
    <LandingView
      landing={landing}
      services={servicesPayload ? asList<ServiceList>(servicesPayload) : []}
      articles={articlesPayload ? asList<ArticleList>(articlesPayload) : []}
    />
  );
}
