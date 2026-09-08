import React, { createContext, useContext, useEffect } from "react";
import { usePathname } from "expo-router";
import { catalogs } from "../i18n/catalogs";
import { type LanguageCode } from "../i18n/languages";
import { siteCopy } from "./copy";
import { rememberWebsiteLanguage } from "./languagePreference";
import {
  isSiteLanguage,
  localizedPath,
  siteRoute,
  type SitePage,
} from "./routes";

const SiteContext = createContext({
  language: "en" as LanguageCode,
  setLanguage: (_code: string) => {},
  href: (page: SitePage) => localizedPath("en", page),
  m: catalogs.en,
  w: siteCopy.en,
});
export function SiteProvider({ children }: { children: React.ReactNode }) {
  const route = siteRoute(usePathname());
  const language = route?.language ?? "en";
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);
  const setLanguage = (code: string) => {
    if (!isSiteLanguage(code)) return;
    const saved = rememberWebsiteLanguage(code);
    const url = new URL(window.location.href);
    url.pathname = localizedPath(code, route?.page ?? "/");
    url.searchParams.delete("lang");
    if (!saved && code === "en") url.searchParams.set("lang", "en");
    window.location.assign(url.pathname + url.search + url.hash);
  };
  return (
    <SiteContext.Provider
      value={{
        language,
        setLanguage,
        href: (page) => localizedPath(language, page),
        m: catalogs[language],
        w: siteCopy[language],
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}
export const useSite = () => useContext(SiteContext);
