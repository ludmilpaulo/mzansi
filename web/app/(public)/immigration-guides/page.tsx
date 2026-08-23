import type { Metadata } from "next";
import Link from "next/link";

import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { asList, asPage } from "@/lib/api";
import { formatDate } from "@/lib/dates";
import { getErrorMessage } from "@/lib/errors";
import { loadSeoDefaults } from "@/lib/public-seo";
import { serverGet } from "@/lib/server-api";
import { generatePageMetadata, routeSeo } from "@/lib/seo";
import type { ArticleList, Category, Paginated, SeoLandingList } from "@/types/api";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const defaults = await loadSeoDefaults();
  const route = routeSeo(defaults, "immigration-guides");
  return generatePageMetadata(
    { title: route.title, description: route.description, path: "/immigration-guides" },
    defaults,
  );
}

export default async function ImmigrationGuidesPage() {
  let articles: Paginated<ArticleList> | null = null;
  let categories: Category[] = [];
  let countries: SeoLandingList[] = [];
  let errorMessage: string | null = null;
  try {
    const [articlePayload, categoryPayload, landingPayload] = await Promise.all([
      serverGet<unknown>("/content/articles"),
      serverGet<unknown>("/content/categories"),
      serverGet<unknown>("/content/landings?kind=country"),
    ]);
    articles = asPage<ArticleList>(articlePayload);
    categories = asList<Category>(categoryPayload);
    countries = asList<SeoLandingList>(landingPayload);
  } catch (error) {
    errorMessage = getErrorMessage(error);
  }
  if (!articles) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <ErrorState description={errorMessage ?? "Guides could not be loaded."} />
      </div>
    );
  }
  return (
    <div className="page-shell py-20">
      <Breadcrumbs items={[{ name: "Immigration guides", path: "/immigration-guides" }]} />
      <p className="eyebrow mt-6">Knowledge hub</p>
      <h1 className="mt-3 font-serif text-5xl text-navy">South Africa immigration guides</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Practical notes from our practice. Not legal advice and not a government publication. Requirements change —
        confirm official sources before you act.
      </p>
      {categories.length > 0 ? (
        <div className="mt-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <span key={category.slug} className="rounded-full border border-border px-3 py-1 text-xs text-muted">
              {category.name}
            </span>
          ))}
        </div>
      ) : null}
      {articles.results.length === 0 ? (
        <div className="mt-12">
          <EmptyState title="No guides yet" />
        </div>
      ) : (
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {articles.results.map((article) => (
            <Link key={article.id} href={`/resources/${article.slug}`}>
              <Card className="h-full hover:border-brand/40">
                <CardBody>
                  <p className="text-xs text-muted">{article.category?.name}</p>
                  <h2 className="mt-2 font-serif text-2xl text-navy">{article.title}</h2>
                  <p className="mt-2 text-sm text-muted">{article.excerpt}</p>
                  <p className="mt-4 text-xs text-muted">
                    {article.last_reviewed_at ? `Reviewed ${formatDate(article.last_reviewed_at)}` : formatDate(article.published_at)}
                  </p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
      {countries.length > 0 ? (
        <section className="mt-16">
          <h2 className="font-serif text-3xl text-navy">Country notes</h2>
          <p className="mt-3 max-w-2xl text-muted">Unique pages only — we do not generate a page per country unless the content is distinct.</p>
          <ul className="mt-6 grid gap-3 md:grid-cols-3">
            {countries.map((landing) => (
              <li key={landing.slug}>
                <Link href={`/countries/${landing.slug}`} className="text-brand hover:underline">
                  {landing.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
