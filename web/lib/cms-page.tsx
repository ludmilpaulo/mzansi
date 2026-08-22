import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ErrorState } from "@/components/ui/ErrorState";
import { getErrorMessage } from "@/lib/errors";
import { serverGet } from "@/lib/server-api";
import type { CmsPage } from "@/types/api";

export function cmsMetadata(slug: string): () => Promise<Metadata> {
  return async () => {
    try {
      const page = await serverGet<CmsPage>(`/content/pages/${slug}`);
      return {
        title: page.seo_title || page.title,
        description: page.seo_description || page.excerpt,
        openGraph: {
          title: page.seo_title || page.title,
          description: page.seo_description || page.excerpt,
        },
      };
    } catch {
      return { title: slug };
    }
  };
}

export async function CmsPageView({ slug }: { slug: string }) {
  let page: CmsPage | null = null;
  let errorMessage: string | null = null;
  try {
    page = await serverGet<CmsPage>(`/content/pages/${slug}`);
  } catch (error) {
    errorMessage = getErrorMessage(error);
  }
  if (!page) {
    if (errorMessage?.toLowerCase().includes("not found")) {
      notFound();
    }
    return (
      <div className="mx-auto max-w-3xl px-6 py-20">
        <ErrorState description={errorMessage ?? "This page could not be loaded."} />
      </div>
    );
  }
  return (
    <article className="mx-auto max-w-3xl px-6 py-20">
      <h1 className="font-serif text-5xl text-navy">{page.title}</h1>
      {page.excerpt ? <p className="mt-4 text-lg text-muted">{page.excerpt}</p> : null}
      <div className="mt-10 whitespace-pre-wrap text-base leading-relaxed text-charcoal">{page.body}</div>
    </article>
  );
}
