import type { Metadata } from "next";
import { Mail, MapPin, Phone } from "lucide-react";

import { ContactForms } from "@/app/(public)/contact/ContactForms";
import { brandFromHome, whatsappHref } from "@/lib/content";
import { cmsMetadata } from "@/lib/cms-page";
import { serverGetOrNull } from "@/lib/server-api";
import type { CmsPage, HomeContent } from "@/types/api";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return cmsMetadata("contact")();
}

export default async function ContactPage() {
  const [page, home] = await Promise.all([
    serverGetOrNull<CmsPage>("/content/pages/contact"),
    serverGetOrNull<HomeContent>("/content/settings/home"),
  ]);
  const brand = home
    ? brandFromHome(home)
    : brandFromHome({ settings: {}, services: [], faqs: [], testimonials: [], featured_articles: [] });
  const whatsapp = whatsappHref(brand.whatsapp);

  return (
    <div className="page-enter">
      <section className="bg-surface">
        <div className="page-shell py-20">
          <p className="eyebrow">Consultation</p>
          <h1 className="mt-3 max-w-3xl text-5xl text-navy md:text-6xl">
            {page?.title ?? "Let's talk about your immigration journey."}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
            {page?.body ?? page?.excerpt ?? "Book a consultation or send us an enquiry."}
          </p>
        </div>
      </section>
      <div className="page-shell grid gap-10 py-16 lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="space-y-4">
          {brand.phone ? (
            <ContactFact icon={Phone} label="Phone" value={brand.phone} href={`tel:${brand.phone.replaceAll(" ", "")}`} />
          ) : null}
          {brand.email ? <ContactFact icon={Mail} label="Email" value={brand.email} href={`mailto:${brand.email}`} /> : null}
          {whatsapp ? <ContactFact icon={Phone} label="WhatsApp" value="Message us on WhatsApp" href={whatsapp} /> : null}
          {brand.address ? <ContactFact icon={MapPin} label="Office" value={brand.address} /> : null}
        </aside>
        <ContactForms />
      </div>
    </div>
  );
}

function ContactFact({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-border bg-white p-6 shadow-[var(--shadow-card)]">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        <Icon className="h-3.5 w-3.5 text-brand" />
        {label}
      </p>
      {href ? (
        <a href={href} className="mt-3 block text-navy hover:text-brand" target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noopener noreferrer" : undefined}>
          {value}
        </a>
      ) : (
        <p className="mt-3 text-navy">{value}</p>
      )}
    </div>
  );
}
