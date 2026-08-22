import { describe, expect, it } from "vitest";

import { asList, asPage, unwrapEnvelope, unwrapList, unwrapPage } from "./api";
import { parseBrandSettings } from "./content";

describe("envelope helpers", () => {
  it("unwraps a success envelope", () => {
    expect(unwrapEnvelope<{ ok: boolean }>({ success: true, data: { ok: true } })).toEqual({ ok: true });
  });

  it("throws the API detail on failure", () => {
    expect(() =>
      unwrapEnvelope({ success: false, error: { code: "permission_denied", detail: "No access" } }),
    ).toThrow("No access");
  });

  it("unwraps paginated and plain lists", () => {
    const page = unwrapPage<number>({
      success: true,
      data: { count: 2, next: null, previous: null, results: [1, 2] },
    });
    expect(page.results).toEqual([1, 2]);
    expect(unwrapList<string>({ success: true, data: ["a"] })).toEqual(["a"]);
  });

  it("normalises already-unwrapped list and page payloads", () => {
    expect(asList<string>(["one", "two"])).toEqual(["one", "two"]);
    expect(asPage<number>({ count: 1, next: null, previous: null, results: [9] }).count).toBe(1);
  });
});

describe("brand settings", () => {
  it("parses brand settings from JSON", () => {
    const brand = parseBrandSettings({
      name: "Mzansi Visa Solutions",
      tagline: "Handled with confidence.",
      phone: "+27 21 000 0000",
      email: "hello@mzansivisa.co.za",
      address: "Cape Town",
      social: { linkedin: "", facebook: "", instagram: "" },
    });
    expect(brand.email).toBe("hello@mzansivisa.co.za");
    expect(brand.phone).toBe("+27 21 000 0000");
  });
});
