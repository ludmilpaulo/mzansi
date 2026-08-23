import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { ServiceCard, splitFeaturedServices } from "@/components/public/ServiceCards";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { asList } from "@/lib/api";
import { featuredServicesFromHome } from "@/lib/content";
import { getErrorMessage } from "@/lib/errors";
import { loadSeoDefaults } from "@/lib/public-seo";
import { serverGet, serverGetOrNull } from "@/lib/server-api";
import { generatePageMetadata, routeSeo } from "@/lib/seo";
import type { HomeContent, ServiceList } from "@/types/api";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const defaults = await loadSeoDefaults();
  const route = routeSeo(defaults, "services");
  return generatePageMetadata({ title: route.title, description: route.description, path: "/services" }, defaults);
}

export default async function ServicesPage() {
  let services: ServiceList[] | null = null;
  let errorMessage: string | null = null;
  let featuredSlugs: string[] = [];
  try {
    const [servicePayload, home] = await Promise.all([
      serverGet<unknown>("/services"),
      serverGetOrNull<HomeContent>("/content/settings/home"),
    ]);
    services = asList<ServiceList>(servicePayload);
    featuredSlugs = home ? featuredServicesFromHome(home).featured_slugs : [];
  } catch (error) {
    errorMessage = getErrorMessage(error);
  }
  if (!services) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <ErrorState description={errorMessage ?? "Services could not be loaded."} />
      </div>
    );
  }
  const { featured, other } = splitFeaturedServices(services, featuredSlugs);
  return (
    <div className="page-shell page-enter py-20">
      <Breadcrumbs items={[{ name: "Services", path: "/services" }]} />
      <p className="eyebrow mt-6">Services</p>
      <h1 className="mt-3 max-w-3xl text-5xl text-navy md:text-6xl">Immigration pathways we support</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
        Each service has its own evidence checklist. Requirements change — we keep yours current and do not promise
        government outcomes.
      </p>
      {services.length === 0 ? (
        <div className="mt-12">
          <EmptyState title="No services published" description="Please book a consultation for current options." />
        </div>
      ) : (
        <>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {featured.map((service) => (
              <ServiceCard key={service.id} service={service} featured />
            ))}
          </div>
          {other.length > 0 ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {other.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
