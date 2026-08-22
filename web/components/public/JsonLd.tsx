import { getSiteUrl } from "@/lib/api";
import type { BrandSettings } from "@/types/api";

export function ProfessionalServiceJsonLd({ brand }: { brand: BrandSettings }) {
  const payload = {
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
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }} />;
}
