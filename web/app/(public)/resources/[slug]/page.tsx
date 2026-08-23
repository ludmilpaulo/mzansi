import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { ArticleJsonLd } from "@/components/public/JsonLd";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { formatDate } from "@/lib/dates";
import { getErrorMessage } from "@/lib/errors";
import { loadSeoDefaults } from "@/lib/public-seo";
import { serverGet } from "@/lib/server-api";
import { metadataFromSeoFields } from "@/lib/seo";
import type { ArticleDetail } from "@/types/api";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const defaults = await loadSeoDefaults();
  try {
    const article = await serverGet<ArticleDetail>(`/content/articles/${slug}`);
    return metadataFromSeoFields(
      article,
      {
        title: article.title,
        description: article.excerpt,
        path: `/resources/${slug}`,
        imageUrl: article.cover_image ?? article.og_image_url,
      },
      defaults,
    );
  } catch {
    return { title: "Resource", robots: { index: false, follow: false } };
  }
}

export default async function ArticlePage({ params }: Params) {
  const { slug } = await params;
  let article: ArticleDetail | null = null;
  let errorMessage: string | null = null;
  try {
    article = await serverGet<ArticleDetail>(`/content/articles/${slug}`);
  } catch (error) {
    errorMessage = getErrorMessage(error);
  }
  if (!article) {
    if (errorMessage?.toLowerCase().includes("not found")) {
      notFound();
    }
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-muted">{errorMessage ?? "Article could not be loaded."}</p>
      </div>
    );
  }
  return (
    <article className="mx-auto max-w-3xl px-6 py-20">
      <ArticleJsonLd
        title={article.title}
        description={article.excerpt}
        path={`/resources/${article.slug}`}
        publishedAt={article.published_at}
        modifiedAt={article.last_reviewed_at || article.updated_at}
        author={article.author_name}
      />
      <Breadcrumbs
        items={[
          { name: "Immigration guides", path: "/immigration-guides" },
          { name: article.title, path: `/resources/${article.slug}` },
        ]}
      />
      <p className="mt-6 text-xs text-muted">
        {article.category?.name}
        {article.published_at ? ` · Published ${formatDate(article.published_at)}` : ""}
        {article.last_reviewed_at ? ` · Last reviewed ${formatDate(article.last_reviewed_at)}` : ""}
        {article.reviewer_name ? ` · Reviewed by ${article.reviewer_name}` : ""}
      </p>
      <h1 className="mt-3 font-serif text-5xl text-navy">{article.title}</h1>
      <p className="mt-4 text-lg text-muted">{article.excerpt}</p>
      <div className="mt-10 whitespace-pre-wrap leading-relaxed text-charcoal">{article.body}</div>
      <p className="mt-8 text-sm text-muted">
        This guide is informational. Official requirements are published by the{" "}
        <a href="https://www.dha.gov.za/" className="text-brand hover:underline" rel="noopener noreferrer" target="_blank">
          Department of Home Affairs
        </a>
        .
      </p>
      <Card className="mt-12 bg-soft">
        <CardBody className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <p className="text-navy">Discuss how this information applies to your circumstances.</p>
          <div className="flex gap-3">
            <Button href="/services" variant="outline">
              View services
            </Button>
            <Button href="/contact">Book a consultation</Button>
          </div>
        </CardBody>
      </Card>
    </article>
  );
}
