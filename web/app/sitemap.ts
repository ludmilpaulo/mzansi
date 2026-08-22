import type { MetadataRoute } from "next";

import { asList, asPage, getSiteUrl } from "@/lib/api";
import { serverGetOrNull } from "@/lib/server-api";
import type { ArticleList, ServiceList } from "@/types/api";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = getSiteUrl();
  const staticRoutes = ["", "/services", "/about", "/resources", "/contact", "/faq", "/privacy", "/terms"];
  const entries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: `${site}${path}`,
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const servicesPayload = await serverGetOrNull<unknown>("/services");
  if (servicesPayload) {
    for (const service of asList<ServiceList>(servicesPayload)) {
      entries.push({ url: `${site}/services/${service.slug}`, changeFrequency: "monthly", priority: 0.6 });
    }
  }
  const articlesPayload = await serverGetOrNull<unknown>("/content/articles");
  if (articlesPayload) {
    for (const article of asPage<ArticleList>(articlesPayload).results) {
      entries.push({ url: `${site}/resources/${article.slug}`, changeFrequency: "monthly", priority: 0.5 });
    }
  }
  return entries;
}
