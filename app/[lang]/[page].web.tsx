import React from "react";
import { useLocalSearchParams } from "expo-router";
import { DemoPage, FaqPage, ContactPage } from "../../src/web/pages";
import NotFound from "../+not-found.web";
import { isSiteLanguage } from "../../src/web/routes";
export { localizedPageParams as generateStaticParams } from "../../src/web/routes";

export default function LocalizedPage() {
  const { lang, page } = useLocalSearchParams<{ lang: string; page: string }>();
  if (!isSiteLanguage(lang)) return <NotFound />;
  if (page === "demo") return <DemoPage />;
  if (page === "faq") return <FaqPage />;
  if (page === "contact") return <ContactPage />;
  return <NotFound />;
}
