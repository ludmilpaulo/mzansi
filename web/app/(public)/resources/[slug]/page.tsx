import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { formatDate } from "@/lib/dates";
import { getErrorMessage } from "@/lib/errors";
import { serverGet } from "@/lib/server-api";
import type { ArticleDetail } from "@/types/api";

export const dynamic = "force-dynamic";

interface Params {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  try {
    const article = await serverGet<ArticleDetail>(`/content/articles/${slug}`);
    return {
      title: article.seo_title || article.title,
      description: article.seo_description || article.excerpt,
      openGraph: {
        title: article.seo_title || article.title,
        description: article.seo_description || article.excerpt,
      },
    };
  } catch {
    return { title: "Resource" };
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
      <Link href="/resources" className="text-sm text-brand">
        All resources
      </Link>
      <p className="mt-6 text-xs text-muted">
        {article.category?.name}
        {article.published_at ? ` · ${formatDate(article.published_at)}` : ""}
      </p>
      <h1 className="mt-3 font-serif text-5xl text-navy">{article.title}</h1>
      <p className="mt-4 text-lg text-muted">{article.excerpt}</p>
      <div className="mt-10 whitespace-pre-wrap leading-relaxed text-charcoal">{article.body}</div>
    </article>
  );
}
