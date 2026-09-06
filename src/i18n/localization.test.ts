import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { URL } from "node:url";
import { getLocales } from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n, { LANGUAGE_STORAGE_KEY } from ".";
import { catalogs } from "./catalogs";
import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  initialLanguage,
  supportedLanguage,
} from "./languages";
import { deviceLanguage } from "./deviceLanguage";
import { useSettingsStore } from "../store/settingsStore";
import { walletNameKey, valuationKey } from "./walletNames";

vi.mock("../services/backup", () => ({
  resumeDeletion: vi.fn(async () => {}),
}));

function setDeviceLocale(languageTag: string) {
  vi.mocked(getLocales).mockReturnValue([
    { languageTag } as ReturnType<typeof getLocales>[number],
  ]);
}

beforeEach(async () => {
  setDeviceLocale("en-US");
  useSettingsStore.setState({
    language: "en",
    hydrated: false,
    error: undefined,
  });
  await i18n.changeLanguage("en");
});

describe("complete translations", () => {
  const keys = Object.keys(catalogs.en).sort();
  const tokens = (value: string) =>
    (value.match(/\{\{[^}]+\}\}/g) ?? []).sort();

  it("registers every catalog, with English as the default", () => {
    expect(DEFAULT_LANGUAGE).toBe("en");
    expect(LANGUAGES[0].code).toBe("en");
    expect(Object.keys(catalogs).sort()).toEqual(
      LANGUAGES.map((l) => l.code).sort(),
    );
    expect(
      readdirSync(new URL("./catalogs/", import.meta.url))
        .filter((f) => f.endsWith(".json"))
        .map((f) => f.replace(".json", ""))
        .sort(),
    ).toEqual(Object.keys(catalogs).sort());
  });

  for (const { code } of LANGUAGES) {
    it(`${code}: every screen and help string is present, with intact substitutions`, () => {
      const catalog = catalogs[code];
      expect(Object.keys(catalog).sort()).toEqual(keys);
      for (const key of Object.keys(catalog) as (keyof typeof catalog)[]) {
        expect(catalog[key].trim(), `${code}.${key}`).not.toBe("");
        expect(tokens(catalog[key]), `${code}.${key}`).toEqual(
          tokens(catalogs.en[key]),
        );
        if (code !== "en" && catalogs.en[key].length > 25) {
          expect(
            catalog[key],
            `${code}.${key}: English text left untranslated`,
          ).not.toBe(catalogs.en[key]);
        }
        expect(
          i18n.t(`monitor.${key}`, {
            lng: code,
            interpolation: { skipOnVariables: true },
          }),
          `${code}.${key}`,
        ).not.toBe(`monitor.${key}`);
      }
      expect(
        i18n.t("monitor.guideFor", { lng: code, exchange: "OKX" }),
      ).toContain("OKX");
    });
  }

  it("ships matching native language declarations and translated Face ID permissions", () => {
    const config = JSON.parse(
      readFileSync(new URL("../../app.json", import.meta.url), "utf8"),
    ).expo;
    const plugin = config.plugins.find(
      (p: unknown) => Array.isArray(p) && p[0] === "expo-localization",
    );
    expect(plugin[1].supportedLocales).toEqual(LANGUAGES.map((l) => l.code));
    expect(config.ios.infoPlist.CFBundleDevelopmentRegion).toBe("en");
    expect(Object.keys(config.locales).sort()).toEqual(
      Object.keys(catalogs).sort(),
    );
    for (const { code } of LANGUAGES) {
      const permission = JSON.parse(
        readFileSync(
          new URL(`../../${config.locales[code]}`, import.meta.url),
          "utf8",
        ),
      );
      expect(permission.ios.NSFaceIDUsageDescription).toBe(
        catalogs[code].faceIDPermission,
      );
    }
  });
});

describe("first-launch language and saved preference", () => {
  it.each([
    ["es-MX", "es"],
    ["de-AT", "de"],
    ["fr-CH", "fr"],
    ["pt-BR", "pt"],
    ["nb-NO", "nb"],
    ["no_NO", "nb"],
    ["nn-NO", "nn"],
    [" UK_ua ", "uk"],
    ["rm-CH", "rm"],
    ["zh-CN", undefined],
    ["", undefined],
    [null, undefined],
  ])("normalizes %s to %s", (tag, expected) => {
    expect(supportedLanguage(tag)).toBe(expected);
  });

  it("uses English for an unsupported primary device language", () => {
    setDeviceLocale("ja-JP");
    expect(deviceLanguage()).toBe("en");
    expect(initialLanguage(null, "ja-JP")).toBe("en");
  });

  it("falls back to English when the device API fails or has no locale", () => {
    vi.mocked(getLocales).mockImplementationOnce(() => {
      throw new Error("unavailable");
    });
    expect(deviceLanguage()).toBe("en");
    vi.mocked(getLocales).mockReturnValueOnce([]);
    expect(deviceLanguage()).toBe("en");
  });

  it("detects and persists the first language, preserving it on subsequent launches", async () => {
    setDeviceLocale("es-ES");
    await useSettingsStore.getState().hydrateSettings();
    expect(useSettingsStore.getState()).toMatchObject({
      language: "es",
      hydrated: true,
    });
    expect(i18n.language).toBe("es");
    expect(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("es");
    setDeviceLocale("de-DE");
    await useSettingsStore.getState().hydrateSettings();
    expect(useSettingsStore.getState().language).toBe("es");
  });

  it("keeps an existing preference and persists a later manual change", async () => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, "ru");
    setDeviceLocale("nb-NO");
    await useSettingsStore.getState().hydrateSettings();
    expect(i18n.language).toBe("ru");
    await useSettingsStore.getState().setLanguage("uk-UA");
    expect(await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("uk");
    await useSettingsStore.getState().hydrateSettings();
    expect(i18n.language).toBe("uk");
    expect(useSettingsStore.getState().language).toBe("uk");
  });

  it("does not change language when saving fails or the choice is unsupported", async () => {
    await useSettingsStore.getState().setLanguage("zh-CN");
    expect(i18n.language).toBe("en");
    vi.mocked(AsyncStorage.setItem).mockRejectedValueOnce(
      new Error("storage unavailable"),
    );
    await expect(
      useSettingsStore.getState().setLanguage("pl"),
    ).rejects.toThrow();
    expect(i18n.language).toBe("en");
    expect(useSettingsStore.getState().language).toBe("en");
  });
});

it("localizes known provider labels while preserving unknown wallet names", () => {
  expect(walletNameKey("UNIFIED · equity")).toBe("monitor.walletUnified");
  expect(walletNameKey("Earn · FlexibleSaving")).toBe(
    "monitor.walletFlexibleSaving",
  );
  expect(walletNameKey("Future new product")).toBeUndefined();
  expect(valuationKey("Exchange USDT valuation")).toBe("monitor.valuationUSDT");
  expect(valuationKey("Exchange USD equity × Coinbase USD/USDT")).toBe(
    "monitor.valuationUSD",
  );
});
