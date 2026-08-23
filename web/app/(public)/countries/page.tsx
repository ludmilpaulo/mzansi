import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { asList } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { loadSeoDefaults } from "@/lib/public-seo";
import { serverGet } from "@/lib/server-api";
import { generatePageMetadata, routeSeo } from "@/lib/seo";
import type { SeoLandingList } from "@/types/api";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const defaults = await loadSeoDefaults();
  const route = routeSeo(defaults, "countries");
  return generatePageMetadata({ title: route.title, description: route.description, path: "/countries" }, defaults);
}

export default async function CountriesPage() {
  let landings: SeoLandingList[] | null = null;
  let errorMessage: string | null = null;
  try {
    landings = asList<SeoLandingList>(await serverGet<unknown>("/content/landings?kind=country"));
  } catch (error) {
    errorMessage = getErrorMessage(error);
  }
  if (!landings) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <ErrorState description={errorMessage ?? "Country guides could not be loaded."} />
      </div>
    );
  }
  return (
    <div className="page-shell py-20">
      <Breadcrumbs items={[{ name: "Countries", path: "/countries" }]} />
      <h1 className="mt-6 text-5xl text-navy">South Africa immigration by nationality</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        These pages exist only where we have unique, maintained information. We do not publish near-identical country
        copies to chase keywords.
      </p>
      {landings.length === 0 ? (
        <div className="mt-12">
          <EmptyState title="No country guides published" />
        </div>
      ) : (
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {landings.map((landing) => (
            <Link key={landing.slug} href={`/countries/${landing.slug}`}>
              <Card className="h-full hover:border-brand/40">
                <CardBody>
                  <h2 className="font-serif text-2xl text-navy">{landing.title}</h2>
                  <p className="mt-2 text-sm text-muted">{landing.excerpt}</p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
