import React, { createContext, useContext, useEffect, useState } from "react";
import { catalogs } from "../i18n/catalogs";
import { deviceLanguage } from "../i18n/deviceLanguage";
import { supportedLanguage, type LanguageCode } from "../i18n/languages";
import { siteCopy } from "./copy";
const KEY = "aircapital.website.language";
const SiteContext = createContext({
  language: "en" as LanguageCode,
  setLanguage: (_code: string) => {},
  m: catalogs.en,
  w: siteCopy.en,
});
export function SiteProvider({ children }: { children: React.ReactNode }) {
  const [language, setCode] = useState<LanguageCode>("en");
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved =
        localStorage.getItem(KEY) ??
        localStorage.getItem("aircapital.language.code");
    } catch {
      /* Browser storage is optional for the public website. */
    }
    setCode(supportedLanguage(saved) ?? deviceLanguage());
  }, []);
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);
  const setLanguage = (value: string) => {
    const code = supportedLanguage(value);
    if (!code) return;
    setCode(code);
    try {
      localStorage.setItem(KEY, code);
    } catch {
      /* The current selection still works without persistence. */
    }
  };
  return (
    <SiteContext.Provider
      value={{
        language,
        setLanguage,
        m: catalogs[language],
        w: siteCopy[language],
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}
export const useSite = () => useContext(SiteContext);
