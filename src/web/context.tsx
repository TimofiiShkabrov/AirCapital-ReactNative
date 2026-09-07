import React, { createContext, useContext, useEffect } from "react";
import { usePathname } from "expo-router";
import { catalogs } from "../i18n/catalogs";
import { type LanguageCode } from "../i18n/languages";
import { siteCopy } from "./copy";
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
    try {
      localStorage.setItem("aircapital.website.language", code);
    } catch {
      // Language navigation also works when browser storage is disabled.
    }
    window.location.assign(localizedPath(code, route?.page ?? "/"));
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
