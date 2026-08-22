import Link from "next/link";
import { ArrowRight, Lock, ShieldCheck, Sparkles, Star } from "lucide-react";

import { ServiceIcon } from "@/components/icons/ServiceIcon";
import { SectionHeading } from "@/components/public/SectionHeading";
import { FaqAccordion } from "@/components/public/FaqAccordion";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { HomeHero, HowItWorksStep, TrustPoint } from "@/lib/content";
import type { ArticleList, BrandSettings, FAQ, ServiceList, Testimonial } from "@/types/api";

const TRUST_ICONS = [ShieldCheck, Lock, Sparkles];

export function HomeHeroSection({ hero, trust }: { hero: HomeHero; trust: TrustPoint[] }) {
  return (
    <section className="relative isolate min-h-[86vh] overflow-hidden bg-navy text-white">
      {hero.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={hero.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-navy via-navy/78 to-navy/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-transparent to-navy/20" />
      <div className="grain pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay" />
      <div className="page-shell relative flex min-h-[86vh] flex-col justify-center py-24">
        {hero.eyebrow ? <p className="text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-soft">{hero.eyebrow}</p> : null}
        <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-[1.05] md:text-7xl">{hero.title}</h1>
        {hero.subtitle ? <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/78">{hero.subtitle}</p> : null}
        <div className="mt-10 flex flex-wrap gap-3">
          <Button href={hero.primary_cta_href} size="lg">
            {hero.primary_cta_label}
          </Button>
          <Button href={hero.secondary_cta_href} variant="outline" size="lg" className="border-white/25 bg-white/8 text-white hover:bg-white hover:text-navy">
            {hero.secondary_cta_label}
          </Button>
        </div>
        {trust.length > 0 ? (
          <div className="mt-14 flex flex-wrap gap-2">
            {trust.slice(0, 3).map((point) => (
              <span key={point.title} className="rounded-full border border-white/15 bg-white/8 px-3.5 py-1.5 text-xs font-medium text-white/80 backdrop-blur">
                {point.title}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function TrustStrip({ points }: { points: TrustPoint[] }) {
  if (points.length === 0) {
    return null;
  }
  return (
    <section className="-mt-8 relative z-10">
      <div className="page-shell">
        <div className="grid gap-4 rounded-[1.6rem] border border-border bg-white p-3 shadow-[var(--shadow-lift)] md:grid-cols-3 md:p-4">
          {points.map((point, index) => {
            const Icon = TRUST_ICONS[index % TRUST_ICONS.length] ?? ShieldCheck;
            return (
              <div key={point.title} className="flex gap-4 rounded-2xl px-4 py-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-soft text-brand">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-navy">{point.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{point.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ServicesGrid({ services }: { services: ServiceList[] }) {
  return (
    <section className="page-shell py-24">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <SectionHeading
          eyebrow="Services"
          title="Pathways we prepare with you"
          description="Each service has a living checklist. Requirements change, and we keep yours current."
        />
        <Button href="/services" variant="outline">
          View all services
        </Button>
      </div>
      {services.length === 0 ? (
        <div className="mt-10">
          <EmptyState title="Services are being updated" description="Please check back shortly or book a consultation." />
        </div>
      ) : (
        <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <Link key={service.id} href={`/services/${service.slug}`} className="group">
              <Card className="card-hover h-full">
                <CardBody className="flex h-full flex-col gap-4 p-7">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-soft text-brand">
                    <ServiceIcon name={service.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="font-serif text-2xl text-navy">{service.name}</h3>
                  <p className="text-sm leading-relaxed text-muted">{service.short_description}</p>
                  {service.estimated_processing ? (
                    <p className="text-xs text-muted">{service.estimated_processing}</p>
                  ) : null}
                  <p className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-brand">
                    Learn more <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function HowItWorksSection({ steps }: { steps: HowItWorksStep[] }) {
  if (steps.length === 0) {
    return null;
  }
  return (
    <section className="bg-navy text-white">
      <div className="page-shell py-24">
        <SectionHeading
          invert
          eyebrow="How it works"
          title="A clear sequence, not a black box"
          description="You always know the stage you are in, and what — if anything — you need to do next."
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {steps.map((step) => (
            <div key={step.step} className="rounded-[1.35rem] border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="font-serif text-3xl text-brand">0{step.step}</p>
              <h3 className="mt-4 font-serif text-2xl">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PortalCta() {
  return (
    <section className="page-shell py-20">
      <div className="overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_58%,#ff6b21_160%)] px-8 py-14 text-white md:px-14">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-soft">Client portal</p>
            <h2 className="mt-3 max-w-xl font-serif text-4xl md:text-5xl">See the next action, not a pile of email</h2>
            <p className="mt-4 max-w-lg text-white/70">
              Status, document checklists, consultations, and messages live in one place. Register to open a profile — an
              application is created only when you choose a service.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/register">Create a client account</Button>
              <Button href="/login" variant="outline" className="border-white/25 bg-transparent text-white hover:bg-white hover:text-navy">
                Sign in
              </Button>
            </div>
          </div>
          <div className="rounded-[1.4rem] border border-white/10 bg-white/8 p-6 backdrop-blur">
            <p className="text-xs uppercase tracking-[0.18em] text-white/50">Next action</p>
            <p className="mt-3 font-serif text-2xl">Upload the document we requested</p>
            <p className="mt-2 text-sm text-white/60">Your portal shows the exact item, the reason if something was rejected, and a secure upload.</p>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-2/3 rounded-full bg-brand" />
            </div>
            <p className="mt-2 text-xs text-white/45">Progress is calculated from real checklist and status data.</p>
          </div>
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
    <section className="page-shell grid gap-12 py-20 md:grid-cols-2 md:items-center">
      <div>
        <SectionHeading
          eyebrow="Why choose us"
          title="Prepared cases. Honest conversations."
          description="We prepare, verify, and track. Official decisions remain with the relevant government authorities."
        />
      </div>
      <div className="space-y-4">
        {points.map((point, index) => (
          <div key={point.title} className="rounded-[1.35rem] border border-border bg-white p-6 shadow-[var(--shadow-card)]">
            <p className="text-xs font-semibold text-brand">0{index + 1}</p>
            <p className="mt-2 font-serif text-2xl text-navy">{point.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted">{point.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
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
                <div className="flex gap-1 text-brand">
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

export function ContactCta({ brand }: { brand: BrandSettings }) {
  return (
    <section className="border-t border-border bg-soft">
      <div className="page-shell flex flex-col items-start justify-between gap-6 py-16 md:flex-row md:items-center">
        <div>
          <h2 className="font-serif text-4xl text-navy">Ready to talk through your options?</h2>
          <p className="mt-2 text-sm text-muted">
            {brand.phone ? `${brand.phone} · ` : ""}
            {brand.email}
          </p>
        </div>
        <Button href="/contact" size="lg">
          Book a consultation
        </Button>
      </div>
    </section>
  );
}

export function FeaturedArticles({ articles }: { articles: ArticleList[] }) {
  if (articles.length === 0) {
    return null;
  }
  return (
    <section className="page-shell pb-20">
      <div className="flex items-end justify-between gap-4">
        <SectionHeading eyebrow="Resources" title="From the desk" />
        <Link href="/resources" className="text-sm font-semibold text-brand">
          All resources
        </Link>
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {articles.map((article) => (
          <Link key={article.id} href={`/resources/${article.slug}`} className="group">
            <Card className="card-hover h-full">
              <CardBody className="p-7">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand">{article.category?.name}</p>
                <h3 className="mt-3 font-serif text-2xl text-navy group-hover:text-brand">{article.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{article.excerpt}</p>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
