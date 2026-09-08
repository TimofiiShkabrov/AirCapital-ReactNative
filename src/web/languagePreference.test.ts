import { describe, expect, it } from "vitest";
import { runInNewContext } from "node:vm";
import { LANGUAGES } from "../i18n/languages";
import { websiteLanguageScript, WEBSITE_LANGUAGE_KEY } from "./languagePreference";

function visit({
  path = "/",
  saved = null,
  device = "en-US",
  blocked = false,
}: { path?: string; saved?: string | null; device?: string; blocked?: boolean } = {}) {
  const url = new URL(path, "https://aircapital.test");
  let destination: string | undefined;
  const window = {
    location: { pathname: url.pathname, href: url.href, replace: (path: string) => { destination = path; } },
    __aircapitalLanguageRedirecting: false,
  };
  runInNewContext(websiteLanguageScript, {
    window, URL,
    navigator: { languages: [device], language: device },
    localStorage: { getItem: (key: string) => {
      expect(key).toBe(WEBSITE_LANGUAGE_KEY);
      if (blocked) throw new Error("Storage blocked");
      return saved;
    } },
  });
  return { destination, redirecting: window.__aircapitalLanguageRedirecting };
}

describe("website entry language negotiation", () => {
  it("detects every supported device language on a first visit", () => {
    for (const { code } of LANGUAGES) {
      expect(visit({ device: `${code}-XX` }).destination).toBe(code === "en" ? undefined : `/${code}`);
    }
    expect(visit({ device: "no-NO" }).destination).toBe("/nb");
    expect(visit({ device: "pt_BR" }).destination).toBe("/pt");
  });
  it("falls back to English for unsupported device languages", () => {
    for (const device of ["ja-JP", "zh-CN", "", "invalid"])
      expect(visit({ device })).toEqual({ destination: undefined, redirecting: false });
  });
  it("honors a saved manual choice, including English", () => {
    expect(visit({ saved: "en", device: "ru-RU" }).destination).toBeUndefined();
    expect(visit({ saved: "de", device: "ru-RU" }).destination).toBe("/de");
    expect(visit({ saved: "invalid", device: "uk-UA" }).destination).toBe("/uk");
  });
  it("never redirects a localized URL or a deep link", () => {
    for (const { code } of LANGUAGES) {
      for (const path of [`/${code}`, `/${code}/faq`])
        expect(visit({ path, saved: "ru", device: "uk-UA" }).destination).toBeUndefined();
    }
    for (const path of ["/demo", "/faq", "/contact", "/privacy", "/unknown"])
      expect(visit({ path, saved: "ru", device: "uk-UA" }).destination).toBeUndefined();
  });
  it("keeps campaign attribution and the requested section", () => {
    expect(visit({ path: "/?utm_source=mail&utm_campaign=launch#download", device: "fr-FR" }))
      .toEqual({ destination: "/fr?utm_source=mail&utm_campaign=launch#download", redirecting: true });
  });
  it("detects the device and respects explicit English with blocked storage", () => {
    expect(visit({ blocked: true, device: "ru-RU" }).destination).toBe("/ru");
    expect(visit({ path: "/?lang=en", blocked: true, device: "ru-RU" }).destination).toBeUndefined();
    expect(visit({ path: "/?lang=es&utm_source=mail#download", saved: "en" }).destination).toBe("/es?utm_source=mail#download");
  });
});
