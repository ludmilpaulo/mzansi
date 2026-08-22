import type { Metadata } from "next";
import Link from "next/link";

import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { asPage } from "@/lib/api";
import { formatDate } from "@/lib/dates";
import { getErrorMessage } from "@/lib/errors";
import { serverGet } from "@/lib/server-api";
import type { ArticleList, Paginated } from "@/types/api";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resources",
  description: "Practical immigration guides. Informational only — not government publications.",
};

export default async function ResourcesPage() {
  let page: Paginated<ArticleList> | null = null;
  let errorMessage: string | null = null;
  try {
    page = asPage<ArticleList>(await serverGet<unknown>("/content/articles"));
  } catch (error) {
    errorMessage = getErrorMessage(error);
  }
  if (!page) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <ErrorState description={errorMessage ?? "Resources could not be loaded."} />
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-6xl px-6 py-20">
      <h1 className="font-serif text-5xl text-navy">Resources</h1>
      <p className="mt-4 max-w-2xl text-muted">Practical notes from our practice. Not legal advice and not a government publication.</p>
      {page.results.length === 0 ? (
        <div className="mt-12">
          <EmptyState title="No articles yet" />
        </div>
      ) : (
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {page.results.map((article) => (
            <Link key={article.id} href={`/resources/${article.slug}`}>
              <Card className="h-full hover:border-brand/40">
                <CardBody>
                  <p className="text-xs text-muted">{article.category?.name}</p>
                  <h2 className="mt-2 font-serif text-2xl text-navy">{article.title}</h2>
                  <p className="mt-2 text-sm text-muted">{article.excerpt}</p>
                  <p className="mt-4 text-xs text-muted">{formatDate(article.published_at)}</p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
