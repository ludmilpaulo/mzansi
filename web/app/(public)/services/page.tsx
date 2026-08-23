import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { ServiceIcon } from "@/components/icons/ServiceIcon";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { asList } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { loadSeoDefaults } from "@/lib/public-seo";
import { serverGet } from "@/lib/server-api";
import { generatePageMetadata, routeSeo } from "@/lib/seo";
import type { ServiceList } from "@/types/api";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const defaults = await loadSeoDefaults();
  const route = routeSeo(defaults, "services");
  return generatePageMetadata({ title: route.title, description: route.description, path: "/services" }, defaults);
}

export default async function ServicesPage() {
  let services: ServiceList[] | null = null;
  let errorMessage: string | null = null;
  try {
    services = asList<ServiceList>(await serverGet<unknown>("/services"));
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
  return (
    <div className="page-shell py-20">
      <Breadcrumbs items={[{ name: "Services", path: "/services" }]} />
      <p className="eyebrow mt-6">Services</p>
      <h1 className="mt-3 max-w-3xl font-serif text-5xl text-navy md:text-6xl">Immigration pathways we support</h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted">
        Each service has its own evidence checklist. Requirements change — we keep yours current and do not promise
        government outcomes.
      </p>
      {services.length === 0 ? (
        <div className="mt-12">
          <EmptyState title="No services published" description="Please book a consultation for current options." />
        </div>
      ) : (
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <Link key={service.id} href={`/services/${service.slug}`} className="group">
              <Card className="card-hover h-full">
                <CardBody className="p-7">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-soft text-brand">
                    <ServiceIcon name={service.icon} className="h-5 w-5" />
                  </span>
                  <h2 className="mt-5 font-serif text-2xl text-navy">{service.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{service.short_description}</p>
                  {service.estimated_processing ? (
                    <p className="mt-5 text-xs text-muted">{service.estimated_processing}</p>
                  ) : null}
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
