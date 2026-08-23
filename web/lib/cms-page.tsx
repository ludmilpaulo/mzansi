import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { ErrorState } from "@/components/ui/ErrorState";
import { getErrorMessage } from "@/lib/errors";
import { loadSeoDefaults } from "@/lib/public-seo";
import { serverGet } from "@/lib/server-api";
import { metadataFromSeoFields } from "@/lib/seo";
import type { CmsPage } from "@/types/api";

export function cmsMetadata(slug: string, path = `/${slug}`): () => Promise<Metadata> {
  return async () => {
    const defaults = await loadSeoDefaults();
    try {
      const page = await serverGet<CmsPage>(`/content/pages/${slug}`);
      return metadataFromSeoFields(page, { title: page.title, description: page.excerpt || page.title, path }, defaults);
    } catch {
      return metadataFromSeoFields(
        {
          seo_title: "",
          seo_description: "",
          og_title: "",
          og_description: "",
          og_image_url: "",
          canonical_path: path,
          robots: "index,follow",
          focus_keyword: "",
          related_keywords: [],
          locale: "en",
        },
        { title: slug, description: defaults.defaultDescription, path },
        defaults,
      );
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
    <article className="page-shell page-enter max-w-3xl py-20">
      <Breadcrumbs items={[{ name: page.title, path: `/${page.slug}` }]} />
      <h1 className="mt-6 text-5xl text-navy">{page.title}</h1>
      {page.excerpt ? <p className="mt-4 text-lg text-muted">{page.excerpt}</p> : null}
      <div className="mt-10 whitespace-pre-wrap text-base leading-relaxed text-charcoal">{page.body}</div>
    </article>
  );
}
