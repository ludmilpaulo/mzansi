import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import { FaqPageJsonLd, ServiceJsonLd } from "@/components/public/JsonLd";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { asList } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { loadSeoDefaults } from "@/lib/public-seo";
import { serverGet, serverGetOrNull } from "@/lib/server-api";
import { metadataFromSeoFields, parseOfficialSources } from "@/lib/seo";
import type { FAQ, ServiceDetail, ServiceList } from "@/types/api";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const defaults = await loadSeoDefaults();
  try {
    const service = await serverGet<ServiceDetail>(`/services/${slug}`);
    return metadataFromSeoFields(
      service,
      { title: service.name, description: service.seo_description || service.short_description, path: `/services/${slug}` },
      defaults,
    );
  } catch {
    return { title: "Service", robots: { index: false, follow: false } };
  }
}

export default async function ServiceDetailPage({ params }: Params) {
  const { slug } = await params;
  let service: ServiceDetail | null = null;
  let errorMessage: string | null = null;
  try {
    service = await serverGet<ServiceDetail>(`/services/${slug}`);
  } catch (error) {
    errorMessage = getErrorMessage(error);
  }
  if (!service) {
    if (errorMessage?.toLowerCase().includes("not found")) {
      notFound();
    }
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-muted">{errorMessage ?? "Service could not be loaded."}</p>
      </div>
    );
  }
  const faqs: FAQ[] = service.faqs
    .filter((item) => item.is_active)
    .map((item) => ({
      id: item.id,
      question: item.question,
      answer: item.answer,
      category: "service",
      sort_order: item.sort_order,
      is_active: item.is_active,
    }));
  const sources = parseOfficialSources(service.official_sources);
  const relatedPayload = await serverGetOrNull<unknown>("/services");
  const related = relatedPayload
    ? asList<ServiceList>(relatedPayload).filter((item) => service.related_service_slugs.includes(item.slug))
    : [];

  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <ServiceJsonLd name={service.name} description={service.short_description} path={`/services/${service.slug}`} />
      <FaqPageJsonLd faqs={faqs.map((item) => ({ question: item.question, answer: item.answer }))} />
      <Breadcrumbs
        items={[
          { name: "Services", path: "/services" },
          { name: service.name, path: `/services/${service.slug}` },
        ]}
      />
      <h1 className="mt-6 font-serif text-5xl text-navy">{service.name}</h1>
      <p className="mt-4 text-lg text-muted">{service.short_description}</p>
      <div className="prose mt-10 max-w-none text-charcoal">
        <p className="whitespace-pre-wrap leading-relaxed">{service.description}</p>
      </div>
      {service.who_its_for ? (
        <section className="mt-12">
          <h2 className="font-serif text-3xl text-navy">Who may need this service</h2>
          <p className="mt-3 whitespace-pre-wrap text-muted">{service.who_its_for}</p>
        </section>
      ) : null}
      {service.process_overview ? (
        <section className="mt-12">
          <h2 className="font-serif text-3xl text-navy">Application process</h2>
          <p className="mt-3 whitespace-pre-wrap text-muted">{service.process_overview}</p>
        </section>
      ) : null}
      {service.how_we_help ? (
        <section className="mt-12">
          <h2 className="font-serif text-3xl text-navy">How Mzansi Visa Solutions helps</h2>
          <p className="mt-3 whitespace-pre-wrap text-muted">{service.how_we_help}</p>
        </section>
      ) : null}
      {service.estimated_processing ? (
        <section className="mt-12">
          <h2 className="font-serif text-3xl text-navy">Processing considerations</h2>
          <p className="mt-3 text-muted">{service.estimated_processing}</p>
        </section>
      ) : null}
      <section className="mt-12">
        <h2 className="font-serif text-3xl text-navy">Typical documents</h2>
        {service.requirements.length === 0 ? (
          <p className="mt-3 text-sm text-muted">A consultant will confirm the checklist for your circumstances.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {service.requirements.map((item) => (
              <li key={item.id} className="rounded-2xl border border-border px-4 py-3">
                <p className="font-medium text-navy">{item.document_type_name}</p>
                <p className="text-sm text-muted">{item.description}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      {sources.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-serif text-3xl text-navy">Official sources</h2>
          <ul className="mt-4 space-y-2">
            {sources.map((source) => (
              <li key={source.url}>
                <a href={source.url} className="text-brand hover:underline" rel="noopener noreferrer" target="_blank">
                  {source.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {faqs.length > 0 ? (
        <section className="mt-12">
          <h2 className="mb-6 font-serif text-3xl text-navy">Frequently asked questions</h2>
          <FaqAccordion faqs={faqs} />
        </section>
      ) : null}
      {related.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-serif text-3xl text-navy">Related services</h2>
          <ul className="mt-4 space-y-2">
            {related.map((item) => (
              <li key={item.slug}>
                <Link href={`/services/${item.slug}`} className="text-brand hover:underline">
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <Card className="mt-12 bg-soft">
        <CardBody className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <p className="text-navy">Book an immigration consultation to discuss whether this pathway is realistic.</p>
          <Button href="/contact">Book a consultation</Button>
        </CardBody>
      </Card>
    </div>
  );
}
