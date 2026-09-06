export const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "de", name: "Deutsch" },
  { code: "nb", name: "Norsk bokmål" },
  { code: "ru", name: "Русский" },
  { code: "uk", name: "Українська" },
  { code: "fr", name: "Français" },
  { code: "pl", name: "Polski" },
  { code: "bg", name: "Български" },
  { code: "cs", name: "Čeština" },
  { code: "da", name: "Dansk" },
  { code: "el", name: "Ελληνικά" },
  { code: "et", name: "Eesti" },
  { code: "fi", name: "Suomi" },
  { code: "hr", name: "Hrvatski" },
  { code: "hu", name: "Magyar" },
  { code: "is", name: "Íslenska" },
  { code: "it", name: "Italiano" },
  { code: "lb", name: "Lëtzebuergesch" },
  { code: "lt", name: "Lietuvių" },
  { code: "lv", name: "Latviešu" },
  { code: "mt", name: "Malti" },
  { code: "nl", name: "Nederlands" },
  { code: "nn", name: "Norsk nynorsk" },
  { code: "pt", name: "Português" },
  { code: "rm", name: "Rumantsch" },
  { code: "ro", name: "Română" },
  { code: "sk", name: "Slovenčina" },
  { code: "sl", name: "Slovenščina" },
  { code: "sv", name: "Svenska" },
  { code: "ar", name: "العربية" },
] as const;
export type LanguageCode = (typeof LANGUAGES)[number]["code"];
export const DEFAULT_LANGUAGE: LanguageCode = "en";
const codes = new Set<string>(LANGUAGES.map(({ code }) => code));
export function supportedLanguage(
  tag?: string | null,
): LanguageCode | undefined {
  const base = tag?.trim().toLowerCase().replaceAll("_", "-").split("-")[0];
  const code = base === "no" ? "nb" : base;
  return code && codes.has(code) ? (code as LanguageCode) : undefined;
}
export function initialLanguage(
  saved: string | null,
  deviceTag?: string | null,
): LanguageCode {
  return supportedLanguage(saved ?? deviceTag) ?? DEFAULT_LANGUAGE;
}
