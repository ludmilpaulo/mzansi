import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FaqAccordion } from "@/components/public/FaqAccordion";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { getErrorMessage } from "@/lib/errors";
import { serverGet } from "@/lib/server-api";
import type { FAQ, ServiceDetail } from "@/types/api";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  try {
    const service = await serverGet<ServiceDetail>(`/services/${slug}`);
    return {
      title: service.seo_title || service.name,
      description: service.seo_description || service.short_description,
      openGraph: {
        title: service.seo_title || service.name,
        description: service.seo_description || service.short_description,
      },
    };
  } catch {
    return { title: "Service" };
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
  return (
    <div className="mx-auto max-w-4xl px-6 py-20">
      <Link href="/services" className="text-sm text-brand">
        All services
      </Link>
      <h1 className="mt-4 font-serif text-5xl text-navy">{service.name}</h1>
      <p className="mt-4 text-lg text-muted">{service.short_description}</p>
      <div className="prose mt-10 max-w-none text-charcoal">
        <p className="whitespace-pre-wrap leading-relaxed">{service.description}</p>
      </div>
      {service.who_its_for ? (
        <section className="mt-12">
          <h2 className="font-serif text-3xl text-navy">Who it is for</h2>
          <p className="mt-3 whitespace-pre-wrap text-muted">{service.who_its_for}</p>
        </section>
      ) : null}
      {service.process_overview ? (
        <section className="mt-12">
          <h2 className="font-serif text-3xl text-navy">Process overview</h2>
          <p className="mt-3 whitespace-pre-wrap text-muted">{service.process_overview}</p>
        </section>
      ) : null}
      {service.estimated_processing ? (
        <p className="mt-8 text-sm text-muted">{service.estimated_processing}</p>
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
      {faqs.length > 0 ? (
        <section className="mt-12">
          <h2 className="mb-6 font-serif text-3xl text-navy">Questions</h2>
          <FaqAccordion faqs={faqs} />
        </section>
      ) : null}
      <Card className="mt-12 bg-soft">
        <CardBody className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <p className="text-navy">Discuss whether this pathway is realistic for you.</p>
          <Button href="/contact">Book a consultation</Button>
        </CardBody>
      </Card>
    </div>
  );
}
