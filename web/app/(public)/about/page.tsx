import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { aboutFromHome, brandFromHome } from "@/lib/content";
import { getErrorMessage } from "@/lib/errors";
import { loadSeoDefaults } from "@/lib/public-seo";
import { serverGet, serverGetOrNull } from "@/lib/server-api";
import { metadataFromSeoFields } from "@/lib/seo";
import type { CmsPage, HomeContent } from "@/types/api";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const defaults = await loadSeoDefaults();
  try {
    const page = await serverGet<CmsPage>("/content/pages/about");
    return metadataFromSeoFields(page, { title: page.title, description: page.excerpt || page.title, path: "/about" }, defaults);
  } catch {
    return metadataFromSeoFields(
      {
        seo_title: "",
        seo_description: "",
        og_title: "",
        og_description: "",
        og_image_url: "",
        canonical_path: "/about",
        robots: "index,follow",
        focus_keyword: "",
        related_keywords: [],
        locale: "en",
      },
      { title: "About", description: defaults.defaultDescription, path: "/about" },
      defaults,
    );
  }
}

export default async function AboutPage() {
  let page: CmsPage | null = null;
  let home: HomeContent | null = null;
  let errorMessage: string | null = null;
  try {
    [page, home] = await Promise.all([
      serverGet<CmsPage>("/content/pages/about"),
      serverGetOrNull<HomeContent>("/content/settings/home"),
    ]);
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
  const about = home ? aboutFromHome(home) : null;
  const brand = home
    ? brandFromHome(home)
    : brandFromHome({ settings: {}, services: [], faqs: [], testimonials: [], featured_articles: [] });
  const sections = about?.sections ?? [];

  return (
    <div className="page-enter">
      <section className="bg-surface">
        <div className="page-shell py-20">
          <Breadcrumbs items={[{ name: page.title, path: "/about" }]} />
          <p className="eyebrow mt-6">{about?.eyebrow ?? "About us"}</p>
          <h1 className="mt-3 max-w-3xl text-5xl text-navy md:text-6xl">{about?.title ?? page.title}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">{about?.intro ?? page.excerpt}</p>
        </div>
      </section>
      {sections.length > 0 ? (
        <section className="page-shell grid gap-6 py-16 md:grid-cols-2">
          {sections.map((section) => (
            <article key={section.title} className="rounded-[1.4rem] border border-border bg-white p-8 shadow-[var(--shadow-card)]">
              <h2 className="text-2xl text-navy">{section.title}</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">{section.body}</p>
            </article>
          ))}
        </section>
      ) : (
        <article className="page-shell py-16">
          <div className="max-w-3xl whitespace-pre-wrap text-base leading-relaxed text-charcoal">{page.body}</div>
        </article>
      )}
      {about?.team_note ? (
        <section className="page-shell pb-16">
          <div className="rounded-[1.6rem] border border-border bg-soft p-8 md:p-10">
            <h2 className="text-2xl text-navy">Meet the people behind your application</h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">{about.team_note}</p>
          </div>
        </section>
      ) : null}
      <section className="border-t border-border bg-navy text-white">
        <div className="page-shell flex flex-col items-start justify-between gap-6 py-16 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl">Ready to talk through your options?</h2>
            <p className="mt-2 text-sm text-white/60">
              {brand.address}
              {brand.email ? ` · ${brand.email}` : ""}
            </p>
          </div>
          <Button href="/book" size="lg">
            Book a Consultation
          </Button>
        </div>
      </section>
    </div>
  );
}
