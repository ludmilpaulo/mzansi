import { isJsonObject, isJsonValue, readString } from "@/lib/api";
import type { BrandSettings, HomeContent, JsonValue } from "@/types/api";

export interface HomeHero {
  eyebrow: string;
  title: string;
  subtitle: string;
  primary_cta_label: string;
  primary_cta_href: string;
  secondary_cta_label: string;
  secondary_cta_href: string;
  image_url: string;
}

export interface TrustPoint {
  title: string;
  body: string;
}

export interface HowItWorksStep {
  step: number;
  title: string;
  body: string;
}

export interface Disclaimer {
  text: string;
}

export interface ContentBlock {
  title: string;
  body: string;
}

export interface LinkItem {
  title: string;
  href: string;
}

export interface PathwayOption {
  label: string;
  href: string;
}

export interface PathwayGuidance {
  title: string;
  body: string;
  disclaimer: string;
  continue_label: string;
  options: PathwayOption[];
}

export interface FeaturedServicesConfig {
  featured_slugs: string[];
  featured_title: string;
  featured_body: string;
  other_title: string;
}

export interface SectionCta {
  title: string;
  body: string;
  cta_label: string;
  cta_href: string;
}

export interface InternationalContent {
  title: string;
  body: string;
  regions: LinkItem[];
}

export interface KnowledgeHubContent {
  title: string;
  body: string;
  categories: LinkItem[];
}

export interface AboutPageContent {
  eyebrow: string;
  title: string;
  intro: string;
  sections: ContentBlock[];
  team_note: string;
}

export interface ConsultationCta {
  eyebrow: string;
  title: string;
  body: string;
  cta_label: string;
  cta_href: string;
  notes: string[];
}

const DEFAULT_BRAND: BrandSettings = {
  name: "Mzansi Visa Solutions",
  tagline: "",
  primary_color: "#FF6B21",
  phone: "",
  email: "",
  address: "",
  whatsapp: "",
  social: { linkedin: "", facebook: "", instagram: "" },
};

export function parseBrandSettings(value: unknown): BrandSettings {
  if (!isJsonObject(value)) {
    return DEFAULT_BRAND;
  }
  const socialValue = value.social;
  const social = isJsonObject(socialValue) ? socialValue : {};
  return {
    name: readString(value.name, DEFAULT_BRAND.name),
    tagline: readString(value.tagline),
    primary_color: readString(value.primary_color, DEFAULT_BRAND.primary_color),
    phone: readString(value.phone),
    email: readString(value.email),
    address: readString(value.address),
    whatsapp: readString(value.whatsapp),
    social: {
      linkedin: readString(social.linkedin),
      facebook: readString(social.facebook),
      instagram: readString(social.instagram),
    },
  };
}

export function parseHomeHero(value: unknown): HomeHero | null {
  if (!isJsonObject(value)) {
    return null;
  }
  const title = readString(value.title);
  if (!title) {
    return null;
  }
  return {
    eyebrow: readString(value.eyebrow),
    title,
    subtitle: readString(value.subtitle),
    primary_cta_label: readString(value.primary_cta_label, "Book a Consultation"),
    primary_cta_href: readString(value.primary_cta_href, "/book"),
    secondary_cta_label: readString(value.secondary_cta_label, "Explore Our Services"),
    secondary_cta_href: readString(value.secondary_cta_href, "/services"),
    image_url: readString(value.image_url),
  };
}

function parsePointList(value: unknown): TrustPoint[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const points: TrustPoint[] = [];
  for (const item of value) {
    if (!isJsonObject(item)) {
      continue;
    }
    const title = readString(item.title);
    const body = readString(item.body);
    if (title && body) {
      points.push({ title, body });
    }
  }
  return points;
}

export function parseTrustPoints(value: unknown): TrustPoint[] {
  return parsePointList(value);
}

export function parseHowItWorks(value: unknown): HowItWorksStep[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const steps: HowItWorksStep[] = [];
  for (const item of value) {
    if (!isJsonObject(item)) {
      continue;
    }
    const title = readString(item.title);
    const body = readString(item.body);
    const step = typeof item.step === "number" ? item.step : steps.length + 1;
    if (title && body) {
      steps.push({ step, title, body });
    }
  }
  return steps.sort((a, b) => a.step - b.step);
}

export function parseDisclaimer(value: unknown): Disclaimer | null {
  if (!isJsonObject(value)) {
    return null;
  }
  const text = readString(value.text);
  return text ? { text } : null;
}

export function setting(home: HomeContent, key: string): JsonValue | undefined {
  const value = home.settings[key];
  return isJsonValue(value) ? value : undefined;
}

export function brandFromHome(home: HomeContent): BrandSettings {
  return parseBrandSettings(setting(home, "brand"));
}

export function heroFromHome(home: HomeContent): HomeHero | null {
  return parseHomeHero(setting(home, "home_hero"));
}

export function trustFromHome(home: HomeContent): TrustPoint[] {
  return parseTrustPoints(setting(home, "trust_points"));
}

export function howItWorksFromHome(home: HomeContent): HowItWorksStep[] {
  return parseHowItWorks(setting(home, "how_it_works"));
}

export function whyChooseFromHome(home: HomeContent): TrustPoint[] {
  const dedicated = parseTrustPoints(setting(home, "why_choose"));
  return dedicated.length > 0 ? dedicated : trustFromHome(home);
}

export function disclaimerFromHome(home: HomeContent): Disclaimer | null {
  return parseDisclaimer(setting(home, "disclaimer"));
}

function parseLinkItems(value: unknown): LinkItem[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const items: LinkItem[] = [];
  for (const item of value) {
    if (!isJsonObject(item)) {
      continue;
    }
    const title = readString(item.title) || readString(item.label);
    const href = readString(item.href);
    if (title && href) {
      items.push({ title, href });
    }
  }
  return items;
}

export function parsePathwayGuidance(value: unknown): PathwayGuidance | null {
  if (!isJsonObject(value)) {
    return null;
  }
  const title = readString(value.title);
  if (!title) {
    return null;
  }
  const options: PathwayOption[] = [];
  if (Array.isArray(value.options)) {
    for (const item of value.options) {
      if (!isJsonObject(item)) {
        continue;
      }
      const label = readString(item.label);
      const href = readString(item.href);
      if (label && href) {
        options.push({ label, href });
      }
    }
  }
  return {
    title,
    body: readString(value.body),
    disclaimer: readString(value.disclaimer),
    continue_label: readString(value.continue_label, "Continue"),
    options,
  };
}

export function parseFeaturedServices(value: unknown): FeaturedServicesConfig {
  if (!isJsonObject(value)) {
    return {
      featured_slugs: [],
      featured_title: "Featured services",
      featured_body: "",
      other_title: "Other immigration services",
    };
  }
  const slugs: string[] = [];
  if (Array.isArray(value.featured_slugs)) {
    for (const item of value.featured_slugs) {
      if (typeof item === "string" && item) {
        slugs.push(item);
      }
    }
  }
  return {
    featured_slugs: slugs,
    featured_title: readString(value.featured_title, "Featured services"),
    featured_body: readString(value.featured_body),
    other_title: readString(value.other_title, "Other immigration services"),
  };
}

export function parseSectionCta(value: unknown, fallbackHref: string): SectionCta | null {
  if (!isJsonObject(value)) {
    return null;
  }
  const title = readString(value.title);
  if (!title) {
    return null;
  }
  return {
    title,
    body: readString(value.body),
    cta_label: readString(value.cta_label, "Learn more"),
    cta_href: readString(value.cta_href, fallbackHref),
  };
}

export function parseInternational(value: unknown): InternationalContent | null {
  if (!isJsonObject(value)) {
    return null;
  }
  const title = readString(value.title);
  if (!title) {
    return null;
  }
  return {
    title,
    body: readString(value.body),
    regions: parseLinkItems(value.regions),
  };
}

export function parseKnowledgeHub(value: unknown): KnowledgeHubContent | null {
  if (!isJsonObject(value)) {
    return null;
  }
  const title = readString(value.title);
  if (!title) {
    return null;
  }
  return {
    title,
    body: readString(value.body),
    categories: parseLinkItems(value.categories),
  };
}

export function parseAboutPage(value: unknown): AboutPageContent | null {
  if (!isJsonObject(value)) {
    return null;
  }
  const title = readString(value.title);
  if (!title) {
    return null;
  }
  return {
    eyebrow: readString(value.eyebrow, "About us"),
    title,
    intro: readString(value.intro),
    sections: parsePointList(value.sections),
    team_note: readString(value.team_note),
  };
}

export function parseConsultationCta(value: unknown): ConsultationCta | null {
  if (!isJsonObject(value)) {
    return null;
  }
  const title = readString(value.title);
  if (!title) {
    return null;
  }
  const notes: string[] = [];
  if (Array.isArray(value.notes)) {
    for (const item of value.notes) {
      if (typeof item === "string" && item) {
        notes.push(item);
      }
    }
  }
  return {
    eyebrow: readString(value.eyebrow, "Ready to move forward?"),
    title,
    body: readString(value.body),
    cta_label: readString(value.cta_label, "Book a Consultation"),
    cta_href: readString(value.cta_href, "/book"),
    notes,
  };
}

export function pathwayFromHome(home: HomeContent): PathwayGuidance | null {
  return parsePathwayGuidance(setting(home, "pathway_guidance"));
}

export function featuredServicesFromHome(home: HomeContent): FeaturedServicesConfig {
  return parseFeaturedServices(setting(home, "featured_services"));
}

export function portalCtaFromHome(home: HomeContent): SectionCta | null {
  return parseSectionCta(setting(home, "portal_cta"), "/login");
}

export function trackingCtaFromHome(home: HomeContent): SectionCta | null {
  return parseSectionCta(setting(home, "tracking_cta"), "/login");
}

export function internationalFromHome(home: HomeContent): InternationalContent | null {
  return parseInternational(setting(home, "international"));
}

export function knowledgeHubFromHome(home: HomeContent): KnowledgeHubContent | null {
  return parseKnowledgeHub(setting(home, "knowledge_hub"));
}

export function aboutFromHome(home: HomeContent): AboutPageContent | null {
  return parseAboutPage(setting(home, "about_page"));
}

export function consultationCtaFromHome(home: HomeContent): ConsultationCta | null {
  return parseConsultationCta(setting(home, "consultation_cta"));
}

export function whatsappHref(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const digits = trimmed.replace(/\D/g, "");
  return digits ? `https://wa.me/${digits}` : "";
}
