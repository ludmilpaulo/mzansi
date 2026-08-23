import type { Metadata } from "next";

import { getSiteUrl, isJsonObject, readString } from "@/lib/api";
import type { JsonObject, JsonValue, LandingFaq, OfficialSource, SeoFields } from "@/types/api";

export interface SeoMetadataInput {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  imageUrl?: string;
  noIndex?: boolean;
  ogTitle?: string;
  ogDescription?: string;
  locale?: string;
  languages?: { [locale: string]: string };
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
}

export interface RouteSeo {
  title: string;
  description: string;
}

export interface SeoDefaults {
  defaultTitle: string;
  defaultDescription: string;
  defaultOgImage: string;
  titleSuffix: string;
  supportedLocales: string[];
  localeDefault: string;
  routes: { [path: string]: RouteSeo };
}

const FALLBACK_DEFAULTS: SeoDefaults = {
  defaultTitle: "Mzansi Visa Solutions | South Africa Visa & Immigration Services",
  defaultDescription:
    "Professional South Africa visa and immigration assistance. We prepare complete files — government decisions remain with the authorities.",
  defaultOgImage: "",
  titleSuffix: "Mzansi Visa Solutions",
  supportedLocales: ["en"],
  localeDefault: "en",
  routes: {},
};

export function absoluteUrl(path: string, siteUrl = getSiteUrl()): string {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  const normalised = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl}${normalised === "/" ? "" : normalised}`;
}

export function withBrandSuffix(title: string, suffix = FALLBACK_DEFAULTS.titleSuffix): string {
  const trimmed = title.trim();
  if (!trimmed) {
    return suffix;
  }
  if (trimmed.toLowerCase().includes(suffix.toLowerCase())) {
    return trimmed;
  }
  return `${trimmed} | ${suffix}`;
}

export function robotsFromDirective(directive?: string, noIndex?: boolean): Metadata["robots"] {
  if (noIndex || directive === "noindex,nofollow") {
    return { index: false, follow: false };
  }
  return { index: true, follow: true };
}

export function generatePageMetadata(input: SeoMetadataInput, defaults: SeoDefaults = FALLBACK_DEFAULTS): Metadata {
  const title = withBrandSuffix(input.title, defaults.titleSuffix);
  const description = input.description.trim() || defaults.defaultDescription;
  const canonical = absoluteUrl(input.path);
  const image = input.imageUrl || defaults.defaultOgImage;
  const ogTitle = input.ogTitle ? withBrandSuffix(input.ogTitle, defaults.titleSuffix) : title;
  const ogDescription = input.ogDescription || description;
  const languages = input.languages ?? (defaults.supportedLocales.length > 1
    ? Object.fromEntries(defaults.supportedLocales.map((locale) => [locale, input.path]))
    : undefined);

  return {
    title: { absolute: title },
    description,
    keywords: input.keywords && input.keywords.length > 0 ? input.keywords : undefined,
    alternates: {
      canonical,
      languages,
    },
    robots: robotsFromDirective(undefined, input.noIndex),
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonical,
      siteName: defaults.titleSuffix,
      locale: input.locale || defaults.localeDefault,
      type: input.type ?? "website",
      images: image ? [{ url: image }] : undefined,
      publishedTime: input.publishedTime,
      modifiedTime: input.modifiedTime,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: ogTitle,
      description: ogDescription,
      images: image ? [image] : undefined,
    },
    authors: input.authors?.map((name) => ({ name })),
  };
}

export function metadataFromSeoFields(
  fields: SeoFields,
  fallback: { title: string; description: string; path: string; imageUrl?: string },
  defaults?: SeoDefaults,
): Metadata {
  return generatePageMetadata(
    {
      title: fields.seo_title || fallback.title,
      description: fields.seo_description || fallback.description,
      path: fields.canonical_path || fallback.path,
      keywords: [fields.focus_keyword, ...fields.related_keywords].filter((item) => item.length > 0),
      imageUrl: fields.og_image_url || fallback.imageUrl,
      noIndex: fields.robots === "noindex,nofollow",
      ogTitle: fields.og_title,
      ogDescription: fields.og_description,
      locale: fields.locale,
    },
    defaults,
  );
}

function parseRouteSeo(value: JsonValue): RouteSeo | null {
  if (!isJsonObject(value)) {
    return null;
  }
  const title = readString(value.title);
  const description = readString(value.description);
  if (!title || !description) {
    return null;
  }
  return { title, description };
}

export function parseSeoDefaults(value: unknown): SeoDefaults {
  if (!isJsonObject(value)) {
    return FALLBACK_DEFAULTS;
  }
  const routesValue = value.routes;
  const routes: SeoDefaults["routes"] = {};
  if (isJsonObject(routesValue)) {
    for (const [key, item] of Object.entries(routesValue)) {
      const parsed = parseRouteSeo(item);
      if (parsed) {
        routes[key] = parsed;
      }
    }
  }
  const locales = Array.isArray(value.supported_locales)
    ? value.supported_locales.filter((item): item is string => typeof item === "string" && item.length > 0)
    : FALLBACK_DEFAULTS.supportedLocales;
  return {
    defaultTitle: readString(value.default_title, FALLBACK_DEFAULTS.defaultTitle),
    defaultDescription: readString(value.default_description, FALLBACK_DEFAULTS.defaultDescription),
    defaultOgImage: readString(value.default_og_image, FALLBACK_DEFAULTS.defaultOgImage),
    titleSuffix: readString(value.title_suffix, FALLBACK_DEFAULTS.titleSuffix),
    supportedLocales: locales.length > 0 ? locales : FALLBACK_DEFAULTS.supportedLocales,
    localeDefault: readString(value.locale_default, FALLBACK_DEFAULTS.localeDefault),
    routes,
  };
}

export function routeSeo(defaults: SeoDefaults, key: string): RouteSeo {
  return defaults.routes[key] ?? { title: defaults.defaultTitle, description: defaults.defaultDescription };
}

export function emptySeoFields(): SeoFields {
  return {
    seo_title: "",
    seo_description: "",
    og_title: "",
    og_description: "",
    og_image_url: "",
    canonical_path: "",
    robots: "index,follow",
    focus_keyword: "",
    related_keywords: [],
    locale: "en",
  };
}

export function readStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

export function asJsonObject(value: unknown): JsonObject {
  return isJsonObject(value) ? value : {};
}

export function parseOfficialSources(value: unknown): OfficialSource[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const sources: OfficialSource[] = [];
  for (const item of value) {
    if (!isJsonObject(item)) {
      continue;
    }
    const label = readString(item.label);
    const url = readString(item.url);
    if (label && /^https:\/\//i.test(url)) {
      sources.push({ label, url });
    }
  }
  return sources;
}

export function parseLandingFaqs(value: unknown): LandingFaq[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const faqs: LandingFaq[] = [];
  for (const item of value) {
    if (!isJsonObject(item)) {
      continue;
    }
    const question = readString(item.question);
    const answer = readString(item.answer);
    if (question && answer) {
      faqs.push({ question, answer });
    }
  }
  return faqs;
}
