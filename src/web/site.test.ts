import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { URL as NodeURL } from "node:url";
import { LANGUAGES } from "../i18n/languages";
import { siteCopy } from "./copy";
import { publicLink } from "./config";
const source = (path: string) =>
  readFileSync(new NodeURL(path, import.meta.url), "utf8");
describe("public website boundaries", () => {
  it("has complete copy for every supported app language", () => {
    expect(Object.keys(siteCopy).sort()).toEqual(
      LANGUAGES.map((l) => l.code).sort(),
    );
    for (const catalog of Object.values(siteCopy)) {
      expect(Object.keys(catalog).sort()).toEqual(
        Object.keys(siteCopy.en).sort(),
      );
      expect(Object.values(catalog).every((v) => v.trim().length > 0)).toBe(
        true,
      );
    }
  });
  it("allows only real secure links to the specified store", () => {
    expect(
      publicLink("https://apps.apple.com/app/id123", ["apps.apple.com"]),
    ).toBe("https://apps.apple.com/app/id123");
    for (const url of [
      "",
      "javascript:alert(1)",
      "http://apps.apple.com/app/id123",
      "https://apps.apple.com.fake.test/",
      "https://user:pass@apps.apple.com/",
    ])
      expect(publicLink(url, ["apps.apple.com"])).toBeUndefined();
  });
  it("routes the web through its own shell and fictional demo without financial stores", () => {
    expect(source("../../app/_layout.web.tsx")).toContain("src/web/SiteRoot");
    expect(source("../../app/demo.web.tsx")).toContain("src/web/pages");
    for (const file of [
      "./SiteRoot.tsx",
      "./DemoBoard.tsx",
      "./pages.tsx",
      "./context.tsx",
    ]) {
      expect(source(file)).not.toMatch(
        /(?:from|import)\s*["'][^"']*(?:store\/|services\/|adapters\/|PrivacyGuard)/,
      );
      expect(source(file)).not.toMatch(/fetch\s*\(/);
    }
    for (const route of [
      "settings",
      "flows",
      "connect-guide",
      "terminal",
      "wallet",
      "details/[accountId]",
    ])
      expect(source(`../../app/${route}.web.tsx`)).toContain("LegacyRedirect");
  });
});
