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
    primary_cta_href: readString(value.primary_cta_href, "/contact"),
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
