import { describe, expect, it } from "vitest";
import { LANGUAGES } from "../i18n/languages";
import {
  localizedPath,
  siteRoute,
  SITE_PAGES,
  localizedHomeParams,
  localizedPageParams,
} from "./routes";
import seoCopy from "./seo-copy.json";

describe("indexable multilingual routes", () => {
  it("round-trips every canonical page for navigation and analytics", () => {
    const paths = new Set<string>();
    for (const { code } of LANGUAGES)
      for (const page of SITE_PAGES) {
        const path = localizedPath(code, page);
        expect(siteRoute(path)).toEqual({ language: code, page });
        paths.add(path);
      }
    expect(paths.size).toBe(LANGUAGES.length * SITE_PAGES.length);
    expect(localizedHomeParams()).toHaveLength(LANGUAGES.length - 1);
    expect(localizedPageParams()).toHaveLength((LANGUAGES.length - 1) * 3);
  });

  it("does not turn unknown pages or legal routes into tracked home pages", () => {
    for (const path of [
      "/xx",
      "/xx/demo",
      "/ru-fake/demo",
      "/RU/demo",
      "/ru/unknown",
      "/ru/demo/extra",
      "/privacy",
      "/settings",
      "/+not-found",
      "/healthz",
    ])
      expect(siteRoute(path), path).toBeUndefined();
  });

  it("provides all SEO fields in every app language", () => {
    expect(Object.keys(seoCopy).sort()).toEqual(
      LANGUAGES.map(({ code }) => code).sort(),
    );
    for (const catalog of Object.values(seoCopy)) {
      expect(Object.keys(catalog).sort()).toEqual(
        Object.keys(seoCopy.en).sort(),
      );
      for (const value of Object.values(catalog))
        expect(value.trim().length).toBeGreaterThan(10);
    }
  });
});
