import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/lib/api";

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/portal/",
        "/dashboard/",
        "/staff/",
        "/login",
        "/register",
        "/account",
        "/documents",
        "/messages",
        "/admin",
        "/api",
      ],
    },
    sitemap: `${site}/sitemap.xml`,
  };
}
