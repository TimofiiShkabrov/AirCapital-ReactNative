import { describe, expect, it } from "vitest";
import locales from "./locales.json";
import { LANGUAGES } from "../i18n/languages";
describe("subscription copy", () => {
  it("covers all supported device languages", () => {
    expect(Object.keys(locales).sort()).toEqual(LANGUAGES.map((language) => language.code).sort());
  });
  for (const { code } of LANGUAGES) it(`${code}: complete copy with intact prices and dates`, () => {
    expect(Object.keys(locales[code]).sort()).toEqual(Object.keys(locales.en).sort());
    for (const key of Object.keys(locales.en) as (keyof typeof locales.en)[]) {
      expect(locales[code][key].trim()).not.toBe("");
      expect(locales[code][key].match(/\{\{[^}]+\}\}/g)).toEqual(locales.en[key].match(/\{\{[^}]+\}\}/g));
      if (code !== "en" && locales.en[key].length > 25) expect(locales[code][key]).not.toBe(locales.en[key]);
    }
  });
});
