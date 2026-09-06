import { getLocales } from "expo-localization";
import { DEFAULT_LANGUAGE, supportedLanguage } from "./languages";
export function deviceLanguage() {
  try {
    return supportedLanguage(getLocales()[0]?.languageTag) ?? DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}
