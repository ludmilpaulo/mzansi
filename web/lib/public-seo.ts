import { serverGetOrNull } from "@/lib/server-api";
import { parseSeoDefaults, type SeoDefaults } from "@/lib/seo";
import type { PublicSeoIndex } from "@/types/api";

export async function loadPublicSeo(): Promise<{ defaults: SeoDefaults; index: PublicSeoIndex | null }> {
  const index = await serverGetOrNull<PublicSeoIndex>("/content/settings/public-seo");
  return {
    defaults: parseSeoDefaults(index?.settings.seo),
    index,
  };
}

export async function loadSeoDefaults(): Promise<SeoDefaults> {
  const { defaults } = await loadPublicSeo();
  return defaults;
}
