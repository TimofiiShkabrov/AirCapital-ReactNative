import { LANGUAGES } from "../i18n/languages";

export const WEBSITE_LANGUAGE_KEY = "aircapital.website.language";

export function rememberWebsiteLanguage(code: string) {
  try {
    localStorage.setItem(WEBSITE_LANGUAGE_KEY, code);
    return true;
  } catch {
    return false;
  }
}

// Self-contained because +html embeds this before hydration and analytics.
// Only the entry URL negotiates a language; localized URLs and deep links stay stable.
function redirectWebsiteEntry(languages: string[], storageKey: string) {
  if (window.location.pathname !== "/") return;
  const normalize = (tag: string | null | undefined) => {
    const base = tag?.trim().toLowerCase().replace(/_/g, "-").split("-")[0];
    const code = base === "no" ? "nb" : base;
    return code && languages.includes(code) ? code : undefined;
  };
  const url = new URL(window.location.href);
  // An explicit choice still works when browser storage is blocked.
  const explicit = normalize(url.searchParams.get("lang"));
  let saved: string | undefined;
  try {
    saved = normalize(localStorage.getItem(storageKey));
  } catch {
    // Device detection also works without storage access.
  }
  const language = explicit ?? saved ?? normalize(navigator.languages?.[0] || navigator.language) ?? "en";
  if (language === "en") return;
  url.pathname = `/${language}`;
  if (explicit) url.searchParams.delete("lang");
  (window as Window & { __aircapitalLanguageRedirecting?: boolean }).__aircapitalLanguageRedirecting = true;
  window.location.replace(url.pathname + url.search + url.hash);
}

export const websiteLanguageScript = `(${redirectWebsiteEntry.toString()})(${JSON.stringify(LANGUAGES.map(({ code }) => code))},${JSON.stringify(WEBSITE_LANGUAGE_KEY)});`;
