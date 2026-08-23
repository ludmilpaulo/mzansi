import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { ServiceIcon } from "@/components/icons/ServiceIcon";
import { Card, CardBody } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { ServiceList } from "@/types/api";

export function ServiceCard({ service, featured = false }: { service: ServiceList; featured?: boolean }) {
  return (
    <Link href={`/services/${service.slug}`} className="group block h-full">
      <Card className={cn("card-hover h-full overflow-hidden", featured && "p-0")}>
        {featured && service.image ? (
          <div className="aspect-[16/9] overflow-hidden bg-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={service.image} alt="" className="h-full w-full object-cover" />
          </div>
        ) : null}
        <CardBody className={cn("flex h-full flex-col", featured ? "p-7" : "p-6")}>
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-soft text-brand">
            <ServiceIcon name={service.icon} className="h-5 w-5" />
          </span>
          <h3 className={cn("mt-5 text-navy", featured ? "text-2xl" : "text-lg")}>{service.name}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{service.short_description}</p>
          <p className="mt-auto inline-flex items-center gap-2 pt-6 text-sm font-semibold text-brand">
            Explore service
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </p>
        </CardBody>
      </Card>
    </Link>
  );
}

export function splitFeaturedServices(services: ServiceList[], featuredSlugs: string[]) {
  const featured = featuredSlugs
    .map((slug) => services.find((service) => service.slug === slug))
    .filter((service): service is ServiceList => Boolean(service));
  const featuredIds = new Set(featured.map((service) => service.id));
  const fallback = featured.length > 0 ? featured : services.slice(0, Math.min(2, services.length));
  const fallbackIds = new Set(fallback.map((service) => service.id));
  return {
    featured: fallback,
    other: services.filter((service) => !fallbackIds.has(service.id) && !featuredIds.has(service.id)),
  };
}
