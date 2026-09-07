import { LANGUAGES, type LanguageCode } from "../i18n/languages";

export const SITE_PAGES = ["/", "/demo", "/faq", "/contact"] as const;
export type SitePage = (typeof SITE_PAGES)[number];

export function isSiteLanguage(value: string): value is LanguageCode {
  return LANGUAGES.some(({ code }) => code === value);
}

// URL language is stable for visitors and crawlers, independent of device settings.
export function siteRoute(pathname: string):
  | {
      language: LanguageCode;
      page: SitePage;
    }
  | undefined {
  const path = pathname.replace(/\/$/, "") || "/";
  if (SITE_PAGES.includes(path as SitePage))
    return { language: "en", page: path as SitePage };
  const [, language, ...rest] = path.split("/");
  const page = rest.length ? `/${rest.join("/")}` : "/";
  if (isSiteLanguage(language) && SITE_PAGES.includes(page as SitePage))
    return { language, page: page as SitePage };
}

export function localizedPath(language: LanguageCode, page: SitePage = "/") {
  return language === "en" ? page : `/${language}${page === "/" ? "" : page}`;
}

export const localizedHomeParams = () =>
  LANGUAGES.filter(({ code }) => code !== "en").map(({ code }) => ({
    lang: code,
  }));

export const localizedPageParams = () =>
  localizedHomeParams().flatMap(({ lang }) =>
    SITE_PAGES.filter((page) => page !== "/").map((page) => ({
      lang,
      page: page.slice(1),
    })),
  );
