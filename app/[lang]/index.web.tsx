import React from "react";
import { useLocalSearchParams } from "expo-router";
import { isSiteLanguage } from "../../src/web/routes";
import { HomePage } from "../../src/web/pages";
import NotFound from "../+not-found.web";
export { localizedHomeParams as generateStaticParams } from "../../src/web/routes";

export default function LocalizedHome() {
  const { lang } = useLocalSearchParams<{ lang: string }>();
  return isSiteLanguage(lang) ? <HomePage /> : <NotFound />;
}
