import React from "react";
import Head from "expo-router/head";
import { LANGUAGES, type LanguageCode } from "../i18n/languages";
import { useSite } from "./context";
import { siteCopy } from "./copy";
import { siteOrigin } from "./config";
import { localizedPath, type SitePage } from "./routes";
import copy from "./seo-copy.json";

export const seoCopy = copy satisfies Record<LanguageCode, typeof copy.en>;

export function pageMetadata(language: LanguageCode, page: SitePage) {
  const seo = seoCopy[language];
  const w = siteCopy[language];
  const label =
    page === "/"
      ? seo.title
      : page === "/demo"
        ? `${w.demo} · ${seo.title}`
        : page === "/faq"
          ? `${w.faq} · AirCapital`
          : `${w.contact} · AirCapital`;
  return {
    title: page === "/" || page === "/demo" ? `${label} | AirCapital` : label,
    description:
      page === "/"
        ? seo.description
        : page === "/demo"
          ? w.demoBody
          : page === "/faq"
            ? seo.faqDescription
            : seo.contactDescription,
    label:
      page === "/"
        ? w.home
        : page === "/demo"
          ? w.demo
          : page === "/faq"
            ? w.faq
            : w.contact,
  };
}

export function Seo({ page }: { page: SitePage }) {
  const { language, w } = useSite();
  const { title, description, label } = pageMetadata(language, page);
  const url = siteOrigin + localizedPath(language, page);
  const home = siteOrigin + localizedPath(language);
  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: title,
      description,
      inLanguage: language,
      isPartOf: { "@id": `${siteOrigin}/#website` },
      ...(page !== "/" ? { breadcrumb: { "@id": `${url}#breadcrumb` } } : {}),
    },
  ];
  if (page === "/")
    graph.push({
      "@type": "WebSite",
      "@id": `${siteOrigin}/#website`,
      url: `${siteOrigin}/`,
      name: "AirCapital",
      inLanguage: LANGUAGES.map(({ code }) => code),
    });
  else
    graph.push({
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: w.home, item: home },
        { "@type": "ListItem", position: 2, name: label, item: url },
      ],
    });
  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index, follow, max-image-preview:large" />
      <link rel="canonical" href={url} />
      {LANGUAGES.map(({ code }) => (
        <link
          key={code}
          rel="alternate"
          hrefLang={code}
          href={siteOrigin + localizedPath(code, page)}
        />
      ))}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={siteOrigin + localizedPath("en", page)}
      />
      <meta property="og:site_name" content="AirCapital" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta
        property="og:image"
        content={`${siteOrigin}/branding/social-card.png`}
      />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="AirCapital" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta
        name="twitter:image"
        content={`${siteOrigin}/branding/social-card.png`}
      />
      <meta name="twitter:image:alt" content="AirCapital" />
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@graph": graph,
        }).replace(/</g, "\\u003c")}
      </script>
    </Head>
  );
}
