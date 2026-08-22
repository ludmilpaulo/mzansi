import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/api";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/portal/", "/staff/", "/login", "/register"],
    },
    sitemap: `${site}/sitemap.xml`,
  };
}
