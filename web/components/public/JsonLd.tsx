import { getSiteUrl } from "@/lib/api";
import type { BrandSettings, LandingFaq } from "@/types/api";

interface JsonLdProps {
  data: { [key: string]: unknown };
}

export function JsonLd({ data }: JsonLdProps) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export function ProfessionalServiceJsonLd({ brand }: { brand: BrandSettings }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        name: brand.name,
        description: brand.tagline,
        telephone: brand.phone,
        email: brand.email,
        url: getSiteUrl(),
        address: {
          "@type": "PostalAddress",
          addressLocality: brand.address,
          addressCountry: "ZA",
        },
        sameAs: [brand.social.linkedin, brand.social.facebook, brand.social.instagram].filter((item) => item.length > 0),
      }}
    />
  );
}

export function OrganizationJsonLd({ brand }: { brand: BrandSettings }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: brand.name,
        url: getSiteUrl(),
        email: brand.email,
        telephone: brand.phone,
        address: {
          "@type": "PostalAddress",
          addressLocality: brand.address,
          addressCountry: "ZA",
        },
      }}
    />
  );
}

export function WebSiteJsonLd({ brand }: { brand: BrandSettings }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: brand.name,
        url: getSiteUrl(),
        inLanguage: "en",
      }}
    />
  );
}

export function BreadcrumbJsonLd({ items }: { items: Array<{ name: string; path: string }> }) {
  const site = getSiteUrl();
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: `${site}${item.path === "/" ? "" : item.path}`,
        })),
      }}
    />
  );
}

export function FaqPageJsonLd({ faqs }: { faqs: LandingFaq[] }) {
  if (faqs.length === 0) {
    return null;
  }
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      }}
    />
  );
}

export function ArticleJsonLd({
  title,
  description,
  path,
  publishedAt,
  modifiedAt,
  author,
}: {
  title: string;
  description: string;
  path: string;
  publishedAt?: string | null;
  modifiedAt?: string | null;
  author?: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description,
        mainEntityOfPage: `${getSiteUrl()}${path}`,
        datePublished: publishedAt ?? undefined,
        dateModified: modifiedAt ?? publishedAt ?? undefined,
        author: author ? { "@type": "Person", name: author } : { "@type": "Organization", name: "Mzansi Visa Solutions" },
      }}
    />
  );
}

export function ServiceJsonLd({
  name,
  description,
  path,
}: {
  name: string;
  description: string;
  path: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Service",
        name,
        description,
        url: `${getSiteUrl()}${path}`,
        provider: { "@type": "Organization", name: "Mzansi Visa Solutions" },
        areaServed: "ZA",
      }}
    />
  );
}
