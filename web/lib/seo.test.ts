import { describe, expect, it } from "vitest";

import { generatePageMetadata, parseSeoDefaults, robotsFromDirective, withBrandSuffix } from "./seo";

describe("SEO helpers", () => {
  it("does not double the brand suffix", () => {
    expect(withBrandSuffix("Mzansi Visa Solutions | South Africa Visa")).toBe(
      "Mzansi Visa Solutions | South Africa Visa",
    );
    expect(withBrandSuffix("Permanent Residence South Africa")).toBe(
      "Permanent Residence South Africa | Mzansi Visa Solutions",
    );
  });

  it("builds canonical, robots, and Open Graph metadata", () => {
    const metadata = generatePageMetadata({
      title: "Permanent Residence South Africa",
      description: "Professional assistance preparing permanent residence files.",
      path: "/services/permanent-residence-permit",
      imageUrl: "https://example.com/og.jpg",
    });
    expect(metadata.alternates?.canonical).toContain("/services/permanent-residence-permit");
    expect(metadata.openGraph?.url).toBe(metadata.alternates?.canonical);
    expect(JSON.stringify(metadata.twitter)).toContain("summary_large_image");
    expect(metadata.title).toEqual({
      absolute: "Permanent Residence South Africa | Mzansi Visa Solutions",
    });
  });

  it("marks private pages noindex", () => {
    expect(robotsFromDirective("noindex,nofollow")).toEqual({ index: false, follow: false });
    expect(robotsFromDirective(undefined, true)).toEqual({ index: false, follow: false });
  });

  it("parses CMS SEO defaults", () => {
    const defaults = parseSeoDefaults({
      default_title: "Default",
      default_description: "Description",
      title_suffix: "Mzansi Visa Solutions",
      supported_locales: ["en"],
      routes: {
        services: { title: "Services title", description: "Services description" },
      },
    });
    expect(defaults.routes.services?.title).toBe("Services title");
    expect(defaults.supportedLocales).toEqual(["en"]);
  });
});
