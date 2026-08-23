import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { asList, asPage } from "@/lib/api";
import { knowledgeHubFromHome } from "@/lib/content";
import { formatDate } from "@/lib/dates";
import { getErrorMessage } from "@/lib/errors";
import { loadSeoDefaults } from "@/lib/public-seo";
import { serverGet, serverGetOrNull } from "@/lib/server-api";
import { generatePageMetadata, routeSeo } from "@/lib/seo";
import type { ArticleList, Category, HomeContent, Paginated, SeoLandingList } from "@/types/api";

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
  let hubCategories: { title: string; href: string }[] = [];
  let errorMessage: string | null = null;
  try {
    const [articlePayload, categoryPayload, landingPayload, home] = await Promise.all([
      serverGet<unknown>("/content/articles"),
      serverGet<unknown>("/content/categories"),
      serverGet<unknown>("/content/landings?kind=country"),
      serverGetOrNull<HomeContent>("/content/settings/home"),
    ]);
    articles = asPage<ArticleList>(articlePayload);
    categories = asList<Category>(categoryPayload);
    countries = asList<SeoLandingList>(landingPayload);
    hubCategories = home ? knowledgeHubFromHome(home)?.categories ?? [] : [];
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
    <div className="page-shell page-enter py-20">
      <Breadcrumbs items={[{ name: "Immigration guides", path: "/immigration-guides" }]} />
      <p className="eyebrow mt-6">Knowledge hub</p>
      <h1 className="mt-3 max-w-3xl text-5xl text-navy md:text-6xl">Immigration Knowledge Hub</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Practical notes from our practice. Not legal advice and not a government publication. Requirements change —
        confirm official sources before you act.
      </p>
      {hubCategories.length > 0 ? (
        <div className="mt-8 flex flex-wrap gap-2">
          {hubCategories.map((category) => (
            <Link
              key={category.title}
              href={category.href}
              className="rounded-full border border-border bg-white px-3.5 py-1.5 text-xs font-medium text-charcoal hover:border-brand"
            >
              {category.title}
            </Link>
          ))}
        </div>
      ) : categories.length > 0 ? (
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
                  <h2 className="mt-3 text-2xl text-navy group-hover:text-brand">{article.title}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{article.excerpt}</p>
                  <p className="mt-5 text-xs text-muted">
                    {article.last_reviewed_at ? `Reviewed ${formatDate(article.last_reviewed_at)}` : formatDate(article.published_at)}
                  </p>
                  <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand">
                    Read guide <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
      {countries.length > 0 ? (
        <section className="mt-20">
          <h2 className="text-3xl text-navy">Country notes</h2>
          <p className="mt-3 max-w-2xl text-muted">
            Unique pages only — we do not generate a page per country unless the content is distinct.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {countries.map((landing) => (
              <Link key={landing.slug} href={`/countries/${landing.slug}`} className="group">
                <Card className="card-hover h-full">
                  <CardBody className="p-6">
                    <h3 className="text-lg text-navy group-hover:text-brand">{landing.title}</h3>
                    <p className="mt-2 text-sm text-muted">{landing.excerpt}</p>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
