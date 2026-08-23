import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/api";
import { serverGetOrNull } from "@/lib/server-api";
import type { PublicSeoIndex } from "@/types/api";

export const dynamic = "force-dynamic";

const STATIC_ROUTES: Array<{ path: string; priority: number }> = [
  { path: "", priority: 1 },
  { path: "/services", priority: 0.9 },
  { path: "/immigration-guides", priority: 0.8 },
  { path: "/countries", priority: 0.7 },
  { path: "/locations", priority: 0.6 },
  { path: "/about", priority: 0.6 },
  { path: "/contact", priority: 0.7 },
  { path: "/book", priority: 0.85 },
  { path: "/faq", priority: 0.6 },
  { path: "/privacy", priority: 0.3 },
  { path: "/terms", priority: 0.3 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getSiteUrl();
  const index = await serverGetOrNull<PublicSeoIndex>("/content/settings/public-seo");
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: `${site}${route.path}`,
    changeFrequency: "weekly",
    priority: route.priority,
  }));

  if (!index) {
    return entries;
  }

  for (const service of index.services) {
    if (service.robots === "noindex,nofollow") {
      continue;
    }
    entries.push({
      url: `${site}/services/${service.slug}`,
      lastModified: undefined,
      changeFrequency: "monthly",
      priority: 0.7,
    });
  }
  for (const article of index.articles) {
    if (article.robots === "noindex,nofollow") {
      continue;
    }
    entries.push({
      url: `${site}/resources/${article.slug}`,
      lastModified: article.updated_at,
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }
  for (const landing of index.landings) {
    if (landing.robots === "noindex,nofollow") {
      continue;
    }
    const prefix = landing.kind === "country" ? "/countries" : "/locations";
    entries.push({
      url: `${site}${prefix}/${landing.slug}`,
      lastModified: landing.updated_at,
      changeFrequency: "monthly",
      priority: landing.kind === "country" ? 0.65 : 0.55,
    });
  }
  return entries;
}
