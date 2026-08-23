import Link from "next/link";

import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import { FaqPageJsonLd } from "@/components/public/JsonLd";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { parseLandingFaqs, parseOfficialSources } from "@/lib/seo";
import type { ArticleList, FAQ, SeoLandingDetail, ServiceList } from "@/types/api";

export function LandingView({
  landing,
  services,
  articles,
}: {
  landing: SeoLandingDetail;
  services: ServiceList[];
  articles: ArticleList[];
}) {
  const prefix = landing.kind === "country" ? "/countries" : "/locations";
  const parent = landing.kind === "country" ? { name: "Countries", path: "/countries" } : { name: "Locations", path: "/locations" };
  const faqs = parseLandingFaqs(landing.faqs);
  const sources = parseOfficialSources(landing.official_sources);
  const relatedServices = services.filter((service) => landing.related_service_slugs.includes(service.slug));
  const relatedArticles = articles.filter((article) => landing.related_article_slugs.includes(article.slug));
  const faqItems: FAQ[] = faqs.map((item, index) => ({
    id: index + 1,
    question: item.question,
    answer: item.answer,
    category: landing.kind,
    sort_order: index,
    is_active: true,
  }));

  return (
    <article className="mx-auto max-w-3xl px-6 py-20">
      <FaqPageJsonLd faqs={faqs} />
      <Breadcrumbs items={[parent, { name: landing.title, path: `${prefix}/${landing.slug}` }]} />
      <p className="eyebrow mt-6">{landing.kind === "country" ? "Country guide" : "Location"}</p>
      <h1 className="mt-3 font-serif text-5xl text-navy">{landing.title}</h1>
      <p className="mt-4 text-lg text-muted">{landing.excerpt}</p>
      <div className="mt-10 whitespace-pre-wrap leading-relaxed text-charcoal">{landing.body}</div>
      {landing.audience ? (
        <section className="mt-12">
          <h2 className="font-serif text-3xl text-navy">Who this is for</h2>
          <p className="mt-3 whitespace-pre-wrap text-muted">{landing.audience}</p>
        </section>
      ) : null}
      {landing.pathways ? (
        <section className="mt-12">
          <h2 className="font-serif text-3xl text-navy">Common pathways</h2>
          <p className="mt-3 whitespace-pre-wrap text-muted">{landing.pathways}</p>
        </section>
      ) : null}
      {landing.documents ? (
        <section className="mt-12">
          <h2 className="font-serif text-3xl text-navy">Typical documents</h2>
          <p className="mt-3 whitespace-pre-wrap text-muted">{landing.documents}</p>
        </section>
      ) : null}
      {sources.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-serif text-3xl text-navy">Official sources</h2>
          <p className="mt-3 text-sm text-muted">
            Government requirements sit with the authorities. These links are official starting points, not Mzansi policy.
          </p>
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
      {faqItems.length > 0 ? (
        <section className="mt-12">
          <h2 className="mb-6 font-serif text-3xl text-navy">Questions</h2>
          <FaqAccordion faqs={faqItems} />
        </section>
      ) : null}
      {relatedServices.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-serif text-3xl text-navy">Related services</h2>
          <ul className="mt-4 space-y-2">
            {relatedServices.map((service) => (
              <li key={service.slug}>
                <Link href={`/services/${service.slug}`} className="text-brand hover:underline">
                  {service.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {relatedArticles.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-serif text-3xl text-navy">Related guides</h2>
          <ul className="mt-4 space-y-2">
            {relatedArticles.map((article) => (
              <li key={article.slug}>
                <Link href={`/resources/${article.slug}`} className="text-brand hover:underline">
                  {article.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <Card className="mt-12 bg-soft">
        <CardBody className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <p className="text-navy">Speak with a consultant about whether a pathway is realistic for your circumstances.</p>
          <Button href="/contact">Book a consultation</Button>
        </CardBody>
      </Card>
    </article>
  );
}
