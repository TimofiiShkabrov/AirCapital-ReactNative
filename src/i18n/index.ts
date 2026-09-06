import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";
import ru from "./locales/ru";
import { catalogs } from "./catalogs";
import { DEFAULT_LANGUAGE, LANGUAGES } from "./languages";
import { deviceLanguage } from "./deviceLanguage";

export const LANGUAGE_STORAGE_KEY = "aircapital.language.code";

i18n.on("languageChanged", (language) => {
  if (typeof document !== "undefined") document.documentElement.lang = language;
});

// eslint-disable-next-line import/no-named-as-default-member
i18n.use(initReactI18next).init({
  resources: Object.fromEntries(
    LANGUAGES.map(({ code }) => [
      code,
      {
        translation: { ...(code === "ru" ? ru : en), monitor: catalogs[code] },
      },
    ]),
  ),
  lng: deviceLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: LANGUAGES.map(({ code }) => code),
  load: "languageOnly",
  interpolation: { escapeValue: false },
  compatibilityJSON: "v4",
});

export default i18n;
