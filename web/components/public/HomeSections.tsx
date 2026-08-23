import Link from "next/link";
import { ArrowRight, Check, Circle, Globe2, Lock, MessageSquare, ShieldCheck, Sparkles, Star, Waypoints } from "lucide-react";

import { SectionHeading } from "@/components/public/SectionHeading";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import { ServiceCard, splitFeaturedServices } from "@/components/public/ServiceCards";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/dates";
import type {
  ConsultationCta,
  FeaturedServicesConfig,
  HomeHero,
  HowItWorksStep,
  InternationalContent,
  KnowledgeHubContent,
  SectionCta,
  TrustPoint,
} from "@/lib/content";
import type { ArticleList, BrandSettings, FAQ, SeoLandingList, ServiceList, Testimonial } from "@/types/api";

const TRUST_ICONS = [ShieldCheck, Lock, Sparkles, Waypoints, MessageSquare];

export function HomeHeroSection({ hero, trust }: { hero: HomeHero; trust: TrustPoint[] }) {
  return (
    <section className="relative bg-surface">
      <div className="page-shell grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:overflow-visible lg:py-20">
        <div className="reveal">
          {hero.eyebrow ? <p className="eyebrow">{hero.eyebrow}</p> : null}
          <h1 className="mt-4 max-w-xl text-[2.25rem] leading-[1.08] text-navy sm:text-5xl lg:text-[4.25rem]">
            {hero.title}
          </h1>
          {hero.subtitle ? <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">{hero.subtitle}</p> : null}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href={hero.primary_cta_href} size="lg">
              {hero.primary_cta_label} →
            </Button>
            <Button href={hero.secondary_cta_href} variant="outline" size="lg">
              {hero.secondary_cta_label} →
            </Button>
          </div>
          {trust.length > 0 ? (
            <ul className="mt-8 space-y-2">
              {trust.slice(0, 3).map((point) => (
                <li key={point.title} className="flex items-center gap-2 text-sm text-charcoal">
                  <Check className="h-4 w-4 text-brand" aria-hidden />
                  {point.title}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="relative">
          <div className="overflow-hidden rounded-[1.75rem] bg-navy shadow-[var(--shadow-lift)]">
            {hero.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hero.image_url} alt="" className="aspect-[4/5] w-full object-cover sm:aspect-[5/6] lg:aspect-[4/5]" />
            ) : (
              <div className="aspect-[4/5] bg-navy" />
            )}
            <div className="absolute inset-0 rounded-[1.75rem] bg-gradient-to-t from-navy/35 via-transparent to-transparent" />
          </div>
          <div className="absolute left-3 top-6 w-[min(100%,16.5rem)] rounded-2xl border border-white/70 bg-white/95 p-4 shadow-[var(--shadow-lift)] sm:-left-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Application status</p>
            <p className="mt-2 text-sm font-semibold text-navy">Application under process</p>
            <p className="mt-1 font-mono text-xs text-muted">Product preview</p>
            <p className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
              Active
            </p>
          </div>
          <div className="absolute bottom-6 right-3 w-[min(100%,16.5rem)] rounded-2xl border border-white/70 bg-white/95 p-4 shadow-[var(--shadow-lift)] sm:-right-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Documents</p>
            <ul className="mt-3 space-y-1.5 text-sm text-charcoal">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-brand" /> Passport
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-brand" /> Proof of residence
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-brand" /> Employment letter
              </li>
            </ul>
            <p className="mt-3 text-xs text-muted">Illustrates the secure client checklist</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function TrustStrip({ points }: { points: TrustPoint[] }) {
  if (points.length === 0) {
    return null;
  }
  return (
    <section className="border-y border-border bg-white">
      <div className="page-shell grid gap-6 py-8 sm:grid-cols-2 lg:grid-cols-5">
        {points.map((point, index) => {
          const Icon = TRUST_ICONS[index % TRUST_ICONS.length] ?? ShieldCheck;
          return (
            <div key={point.title} className="flex items-start gap-3">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-navy">{point.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{point.body}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function ServicesGrid({ services, config }: { services: ServiceList[]; config: FeaturedServicesConfig }) {
  const { featured, other } = splitFeaturedServices(services, config.featured_slugs);
  return (
    <section className="page-shell py-24" id="services">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <SectionHeading
          eyebrow="Services"
          title={config.featured_title}
          description={config.featured_body || "Professional assistance for the South African immigration pathways we actually prepare."}
        />
        <Button href="/services" variant="outline">
          View all services →
        </Button>
      </div>
      {services.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="Services are being updated" description="Please check back shortly or book a consultation." />
        </div>
      ) : (
        <>
          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {featured.map((service) => (
              <ServiceCard key={service.id} service={service} featured />
            ))}
          </div>
          {other.length > 0 ? (
            <>
              <h3 className="mt-16 text-xl text-navy">{config.other_title}</h3>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                {other.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </>
          ) : null}
        </>
      )}
    </section>
  );
}

export function HowItWorksSection({ steps }: { steps: HowItWorksStep[] }) {
  if (steps.length === 0) {
    return null;
  }
  const first = steps.slice(0, 3);
  const second = steps.slice(3, 6).reverse();
  return (
    <section id="how-it-works" className="bg-navy text-white">
      <div className="page-shell py-24">
        <SectionHeading
          invert
          eyebrow="How it works"
          title="A clear sequence, not a black box"
          description="You always know the stage you are in, and what — if anything — you need to do next."
        />
        <ol className="mt-14 space-y-4 md:hidden">
          {steps.map((step) => (
            <li key={step.step} className="relative border-l border-white/15 pl-6">
              <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full bg-brand" />
              <p className="text-xs font-semibold text-brand">0{step.step}</p>
              <h3 className="mt-2 text-xl">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{step.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-14 hidden md:block" aria-hidden="true">
          <div className="grid grid-cols-3 gap-5">
            {first.map((step, index) => (
              <JourneyCard key={step.step} step={step} showArrow={index < first.length - 1} />
            ))}
          </div>
          {second.length > 0 ? (
            <div className="my-4 flex justify-end pr-[16%]">
              <span className="text-brand" aria-hidden>
                ↓
              </span>
            </div>
          ) : null}
          {second.length > 0 ? (
            <div className="grid grid-cols-3 gap-5">
              {second.map((step, index) => (
                <JourneyCard key={step.step} step={step} showArrow={index < second.length - 1} reverse />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function JourneyCard({
  step,
  showArrow,
  reverse = false,
}: {
  step: HowItWorksStep;
  showArrow: boolean;
  reverse?: boolean;
}) {
  return (
    <div className="relative rounded-[1.35rem] border border-white/10 bg-white/5 p-6">
      <p className="text-sm font-semibold text-brand">0{step.step}</p>
      <h3 className="mt-3 text-2xl">{step.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/65">{step.body}</p>
      {showArrow ? (
        <span className="absolute -right-3 top-8 hidden text-brand xl:block" aria-hidden>
          {reverse ? "←" : "→"}
        </span>
      ) : null}
    </div>
  );
}

export function PortalCta({ content }: { content: SectionCta | null }) {
  const title = content?.title ?? "Your entire immigration journey in one place.";
  const body =
    content?.body ??
    "Track your application, upload documents, receive requests, communicate with your consultant and stay informed from anywhere in the world.";
  return (
    <section className="page-shell py-20" id="client-portal">
      <div className="overflow-hidden rounded-[2rem] border border-border bg-white shadow-[var(--shadow-card)]">
        <div className="grid items-center gap-10 px-8 py-12 lg:grid-cols-2 lg:px-14">
          <div>
            <p className="eyebrow">Client portal</p>
            <h2 className="mt-3 max-w-xl text-4xl text-navy md:text-5xl">{title}</h2>
            <p className="mt-4 max-w-lg text-muted">{body}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href={content?.cta_href ?? "/login"}>{content?.cta_label ?? "Access Client Portal"}</Button>
              <Button href="/register" variant="outline">
                Create an account
              </Button>
            </div>
          </div>
          <div className="rounded-[1.4rem] border border-border bg-surface p-6" aria-hidden>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Product preview</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <PreviewTile label="Application" value="In preparation" meta="Checklist-driven progress" />
              <PreviewTile label="Documents" value="Verified items" meta="Rejections include a reason" />
              <PreviewTile label="Next action" value="Upload requested file" meta="One clear task at a time" />
              <PreviewTile label="Messages" value="Consultant thread" meta="Kept with the case" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PreviewTile({ label, value, meta }: { label: string; value: string; meta: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold text-navy">{value}</p>
      <p className="mt-1 text-xs text-muted">{meta}</p>
    </div>
  );
}

export function TrackingSection({ content }: { content: SectionCta | null }) {
  const title = content?.title ?? "Know where your application stands.";
  const stages = [
    { label: "Consultation", done: true },
    { label: "Documents", done: true },
    { label: "Application prepared", done: true },
    { label: "Submitted", done: true },
    { label: "Under process", done: false, current: true },
    { label: "Decision", done: false },
    { label: "Completed", done: false },
  ];
  return (
    <section className="bg-soft">
      <div className="page-shell grid items-center gap-12 py-20 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Application tracking</p>
          <h2 className="mt-3 text-4xl text-navy md:text-5xl">{title}</h2>
          {content?.body ? <p className="mt-4 text-muted">{content.body}</p> : null}
          <div className="mt-8">
            <Button href={content?.cta_href ?? "/login"}>{content?.cta_label ?? "Track My Application"}</Button>
          </div>
        </div>
        <div className="rounded-[1.6rem] border border-border bg-white p-7 shadow-[var(--shadow-card)]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Illustrative timeline</p>
          <p className="mt-2 text-sm font-semibold text-navy">Mzansi case stages</p>
          <ol className="mt-6 space-y-3">
            {stages.map((stage) => (
              <li key={stage.label} className="flex items-center gap-3 text-sm">
                {stage.done ? (
                  <Check className="h-4 w-4 text-brand" aria-hidden />
                ) : stage.current ? (
                  <Circle className="h-4 w-4 fill-brand text-brand" aria-hidden />
                ) : (
                  <Circle className="h-4 w-4 text-border" aria-hidden />
                )}
                <span className={stage.done || stage.current ? "text-navy" : "text-muted"}>{stage.label}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export function WhyChooseUs({ points }: { points: TrustPoint[] }) {
  if (points.length === 0) {
    return null;
  }
  return (
    <section className="page-shell py-24">
      <SectionHeading
        eyebrow="Why Mzansi"
        title="Prepared cases. Honest conversations."
        description="We prepare, verify, and track. Official decisions remain with the relevant government authorities."
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {points.map((point, index) => (
          <div key={point.title} className="rounded-[1.35rem] border border-border bg-white p-7 shadow-[var(--shadow-card)]">
            <p className="text-xs font-semibold text-brand">0{index + 1}</p>
            <h3 className="mt-3 text-xl text-navy">{point.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{point.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function InternationalSection({
  content,
  landings,
}: {
  content: InternationalContent | null;
  landings: SeoLandingList[];
}) {
  if (!content && landings.length === 0) {
    return null;
  }
  return (
    <section className="relative overflow-hidden bg-navy text-white">
      <GlobeBackdrop />
      <div className="page-shell relative py-24">
        <SectionHeading
          invert
          eyebrow="International clients"
          title={content?.title ?? "From anywhere in the world to your next chapter in South Africa."}
          description={content?.body}
        />
        {landings.length > 0 ? (
          <div className="mt-10 flex flex-wrap gap-2">
            {landings.map((landing) => (
              <Link
                key={landing.slug}
                href={`/countries/${landing.slug}`}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-white/80 hover:border-brand hover:text-white"
              >
                {landing.title}
              </Link>
            ))}
          </div>
        ) : null}
        {content && content.regions.length > 0 ? (
          <div className="mt-12">
            <h3 className="text-lg text-white">Immigration support for clients around the world</h3>
            <p className="mt-2 max-w-2xl text-sm text-white/55">
              Regional pages help you find relevant notes. They do not mean we operate offices in every region.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {content.regions.map((region) => (
                <Link
                  key={region.title}
                  href={region.href}
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-medium text-white hover:border-brand"
                >
                  {region.title}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function GlobeBackdrop() {
  return <Globe2 className="pointer-events-none absolute -right-20 top-8 h-[420px] w-[420px] text-white opacity-[0.07]" aria-hidden />;
}

export function TestimonialsSection({ testimonials }: { testimonials: Testimonial[] }) {
  if (testimonials.length === 0) {
    return null;
  }
  return (
    <section className="bg-surface">
      <div className="page-shell py-24">
        <SectionHeading eyebrow="Client voices" title="What the process felt like" />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {testimonials.map((item) => (
            <Card key={item.id} className="h-full">
              <CardBody className="flex h-full flex-col p-7">
                <div className="flex gap-1 text-brand" aria-label={`${item.rating} out of 5`}>
                  {Array.from({ length: Math.min(item.rating, 5) }).map((_, index) => (
                    <Star key={`${item.id}-${index}`} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-5 text-base leading-relaxed text-charcoal">“{item.quote}”</p>
                <div className="mt-auto pt-8">
                  <p className="font-semibold text-navy">{item.name}</p>
                  <p className="text-xs text-muted">{item.role}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeFaq({ faqs }: { faqs: FAQ[] }) {
  if (faqs.length === 0) {
    return null;
  }
  return (
    <section className="page-shell grid gap-12 py-24 lg:grid-cols-[1fr_1.2fr] lg:items-start">
      <SectionHeading
        eyebrow="FAQ"
        title="Straight answers"
        description="Immigration rules change. If you cannot find what you need, send an inquiry and we will respond during business hours."
      />
      <div>
        <FaqAccordion faqs={faqs} />
        <p className="mt-6 text-sm">
          <Link href="/faq" className="font-semibold text-brand hover:underline">
            View all questions
          </Link>
        </p>
      </div>
    </section>
  );
}

export function ContactCta({ brand, content }: { brand: BrandSettings; content: ConsultationCta | null }) {
  return (
    <section className="border-t border-border bg-navy text-white">
      <div className="page-shell py-20 text-center">
        <p className="eyebrow">{content?.eyebrow ?? "Ready to move forward?"}</p>
        <h2 className="mx-auto mt-4 max-w-2xl text-4xl md:text-5xl">{content?.title ?? "Let's understand your situation"}</h2>
        <p className="mx-auto mt-4 max-w-xl text-white/65">
          {content?.body ?? "Identify the appropriate next step with a consultation. We explain options; we do not promise government outcomes."}
        </p>
        <div className="mt-8">
          <Button href={content?.cta_href ?? "/contact"} size="lg">
            {content?.cta_label ?? "Book a Consultation"}
          </Button>
        </div>
        {content && content.notes.length > 0 ? (
          <p className="mt-6 text-sm text-white/50">{content.notes.join(" · ")}</p>
        ) : (
          <p className="mt-6 text-sm text-white/50">
            {brand.phone ? `${brand.phone} · ` : ""}
            {brand.email}
          </p>
        )}
      </div>
    </section>
  );
}

export function FeaturedArticles({
  articles,
  hub,
}: {
  articles: ArticleList[];
  hub: KnowledgeHubContent | null;
}) {
  if (articles.length === 0 && !hub) {
    return null;
  }
  return (
    <section className="page-shell pb-24">
      <div className="flex items-end justify-between gap-4">
        <SectionHeading
          eyebrow="Immigration knowledge hub"
          title={hub?.title ?? "Guides you can actually use"}
          description={hub?.body}
        />
        <Link href="/immigration-guides" className="hidden text-sm font-semibold text-brand md:inline">
          All resources →
        </Link>
      </div>
      {hub && hub.categories.length > 0 ? (
        <div className="mt-8 flex flex-wrap gap-2">
          {hub.categories.map((category) => (
            <Link
              key={category.title}
              href={category.href}
              className="rounded-full border border-border bg-white px-3.5 py-1.5 text-xs font-medium text-charcoal hover:border-brand"
            >
              {category.title}
            </Link>
          ))}
        </div>
      ) : null}
      {articles.length > 0 ? (
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {articles.map((article) => (
            <Link key={article.id} href={`/resources/${article.slug}`} className="group">
              <Card className="card-hover h-full overflow-hidden">
                {article.cover_image ? (
                  <div className="aspect-[16/10] overflow-hidden bg-soft">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={article.cover_image} alt="" className="h-full w-full object-cover" />
                  </div>
                ) : null}
                <CardBody className="p-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">
                    {article.category?.name ?? "Immigration guide"}
                  </p>
                  <h3 className="mt-3 text-2xl text-navy group-hover:text-brand">{article.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{article.excerpt}</p>
                  <p className="mt-5 text-xs text-muted">
                    {article.published_at ? formatDate(article.published_at) : null}
                  </p>
                  <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand">
                    Read guide <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
