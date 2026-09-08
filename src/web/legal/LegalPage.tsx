import React from "react";
import Head from "expo-router/head";
import { legalDocuments, legalDate, legalReady } from "./documents";
import { useSite } from "../context";
import labels from "../../i18n/legalLabels.json";

export const legalPaths = ["privacy", "terms", "cookies", "data-deletion", "legal"] as const;
export function LegalPage({ document }: { document: typeof legalPaths[number] }) {
  const { language } = useSite();
  const doc = legalDocuments[document];
  return (
    <>
      <Head>
        <title>{doc.title} · AirCapital</title>
        <meta name="description" content={doc.summary} />
        <link rel="canonical" href={`https://aircapital.app/${document}`} />
        <meta name="robots" content="noindex, follow, nosnippet" />
      </Head>
      <div className="legal-layout container">
        <nav className="legal-navigation" aria-label={labels[language][4]}>
          {legalPaths.map((path, index) => (
            <a key={path} href={`/${path}`} aria-current={document === path ? "page" : undefined}>
              {labels[language][index]} <small lang="en">English</small>
            </a>
          ))}
        </nav>
        <article className="legal-document" lang="en" dir="ltr">
          <header>
            <p className="eyebrow">AIRCAPITAL · LEGAL</p>
            <h1>{doc.title}</h1>
            <p className="legal-intro">{doc.summary}</p>
            <p className="legal-date">Last updated: <time dateTime={legalDate}>{legalDate}</time> · English</p>
          </header>
          {!legalReady && <aside className="legal-draft" role="note">Draft for review — operator details must be confirmed before publication or submission to an app store.</aside>}
          <nav className="legal-contents" aria-label="On this page">
            {doc.sections.map(section => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}
          </nav>
          {doc.sections.map(section => (
            <section key={section.id} id={section.id} tabIndex={-1} data-nosnippet="">
              <h2>{section.title}</h2>
              {section.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              {section.links && <ul>{section.links.map(link => <li key={link.href}><a href={link.href}>{link.label}</a></li>)}</ul>}
            </section>
          ))}
        </article>
      </div>
    </>
  );
}
