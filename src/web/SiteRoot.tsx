import React, { useEffect, useState } from "react";
import { Slot, usePathname } from "expo-router";
import { LANGUAGES } from "../i18n/languages";
import { SiteProvider, useSite } from "./context";
import { browserAnalytics } from "./analyticsBrowser";
import { Arrow } from "./icons";
import "./site.css";
import { localizedPath, siteRoute } from "./routes";
import legalLabels from "../i18n/legalLabels.json";

export function DemoLink({
  place,
  children,
  className = "button primary",
}: {
  place: "header" | "hero" | "footer" | "download";
  children: React.ReactNode;
  className?: string;
}) {
  const { href } = useSite();
  return (
    <a
      className={className}
      href={href("/demo")}
      onClick={() => browserAnalytics()?.track("demo_open", place)}
    >
      {children}
      <Arrow />
    </a>
  );
}
function Shell() {
  const { w, m, language, setLanguage, href: siteHref } = useSite();
  const path = usePathname();
  const currentPage = siteRoute(path)?.page ?? "/";
  const [menu, setMenu] = useState(false);
  const [consentOpen, setConsentOpen] = useState(false);
  useEffect(() => {
    setConsentOpen(!browserAnalytics()?.initialize());
  }, []);
  const choose = (choice: "accepted" | "declined") => {
    browserAnalytics()?.choose(choice);
    setConsentOpen(false);
  };
  const links = [
    [siteHref("/"), w.home],
    [siteHref("/demo"), w.demo],
    [siteHref("/faq"), w.faq],
    [siteHref("/contact"), w.contact],
  ];
  return (
    <div
      className="site"
      onClickCapture={(event) => {
        // In-page scrolling must not create extra history-based GA page views.
        if (
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        )
          return;
        const anchor =
          event.target instanceof Element
            ? event.target.closest<HTMLAnchorElement>("a[href]")
            : null;
        if (
          !anchor ||
          anchor.target ||
          !anchor.hash ||
          anchor.origin !== location.origin ||
          anchor.pathname !== location.pathname ||
          anchor.search !== location.search
        )
          return;
        const target = document.getElementById(anchor.hash.slice(1));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
            ? "instant"
            : "smooth",
          block: "start",
        });
        target.focus({ preventScroll: true });
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape") setMenu(false);
      }}
    >
      <a className="skip-link" href="#main">
        {w.skip}
      </a>
      <header className="site-header">
        <div className="header-inner container">
          <a className="brand" href={siteHref("/")} aria-label="AirCapital">
            <img src="/branding/icon-192.png" width="36" height="36" alt="" />
            AirCapital<span className="brand-dot">.</span>
          </a>
          <button
            className="menu-toggle"
            aria-expanded={menu}
            aria-controls="site-nav"
            onClick={() => setMenu(!menu)}
          >
            {w.menu}
            <span aria-hidden="true">{menu ? "×" : "☰"}</span>
          </button>
          <nav
            id="site-nav"
            className={menu ? "site-nav is-open" : "site-nav"}
            aria-label={w.menu}
          >
            {links.map(([href, label]) => (
              <a
                key={href}
                href={href}
                aria-current={path === href ? "page" : undefined}
                onClick={() => {
                  if (href === siteHref("/demo"))
                    browserAnalytics()?.track("demo_open", "header");
                }}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="header-actions">
            <label className="language-select">
              <span className="sr-only">{m.language}</span>
              <span aria-hidden="true">◎</span>
              <select
                aria-label={m.language}
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            <a
              className="button small outline header-download"
              href={siteHref("/") + "#download"}
            >
              {w.getApp}
              <Arrow diagonal />
            </a>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        <Slot />
      </main>
      <footer className="site-footer container">
        <div className="footer-top">
          <div>
            <a className="brand" href={siteHref("/")}>
              <img src="/branding/icon-192.png" width="30" height="30" alt="" />
              AirCapital<span className="brand-dot">.</span>
            </a>
            <p>{w.footer}</p>
          </div>
          <nav aria-label={w.footer}>
            {links.map(([href, label]) => (
              <a
                key={href}
                href={href}
                onClick={() => {
                  if (href === siteHref("/demo"))
                    browserAnalytics()?.track("demo_open", "footer");
                }}
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
        <nav className="footer-legal" aria-label={legalLabels[language][4]}>
          {["privacy", "terms", "cookies", "data-deletion", "legal"].map(
            (slug, index) => (
              <a key={slug} href={`/${slug}`}>
                {legalLabels[language][index]}
              </a>
            ),
          )}
        </nav>
        <details className="footer-languages">
          <summary>{m.language}</summary>
          <nav aria-label={m.language}>
            {LANGUAGES.map(({ code, name }) => (
              <a
                key={code}
                lang={code}
                hrefLang={code}
                href={localizedPath(code, currentPage)}
                aria-current={code === language ? "true" : undefined}
              >
                {name}
              </a>
            ))}
          </nav>
        </details>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} AirCapital</span>
          <div>
            <button onClick={() => setConsentOpen(true)}>{w.cookies}</button>
          </div>
          <span>iOS · Android</span>
        </div>
      </footer>
      {consentOpen && (
        <section
          className="cookie-panel"
          role="region"
          aria-label={w.cookieTitle}
        >
          <div>
            <h2>{w.cookieTitle}</h2>
            <p>
              {w.cookieBody} <a href="/privacy">{m.privacy}</a>
            </p>
          </div>
          <div className="cookie-actions">
            <button
              className="button outline"
              onClick={() => choose("declined")}
            >
              {w.reject}
            </button>
            <button
              className="button primary"
              onClick={() => choose("accepted")}
            >
              {w.accept}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
export default function SiteRoot() {
  return (
    <SiteProvider>
      <Shell />
    </SiteProvider>
  );
}
