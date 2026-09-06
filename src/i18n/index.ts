import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import ru from "./locales/ru";
import { monitorEn, monitorRu, monitorAr } from "./monitor";

export const LANGUAGE_STORAGE_KEY = "aircapital.language.code";

// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: { ...en, monitor: monitorEn } },
    ru: { translation: { ...ru, monitor: monitorRu } },
    ar: { translation: { ...en, monitor: monitorAr } },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  compatibilityJSON: "v4",
});

export default i18n;
