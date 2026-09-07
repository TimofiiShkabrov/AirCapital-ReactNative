import React from "react";
import { Seo, seoCopy } from "./Seo";
import { useSite } from "./context";
import { Arrow, FeatureIcon, StoreIcon } from "./icons";
import { DemoLink } from "./SiteRoot";
import {
  storeLinks,
  storeAvailability,
  contactEmail,
  telegramLink,
} from "./config";
import { browserAnalytics } from "./analyticsBrowser";
import { DemoBoard } from "./DemoBoard";
import operator from "./legal/operator.json";
import legalLabels from "../i18n/legalLabels.json";

const exchanges = [
  { id: "binance", name: "Binance" },
  { id: "bybit", name: "Bybit" },
  { id: "okx", name: "OKX" },
  { id: "bingx", name: "BingX" },
  { id: "gateio", name: "Gate.io" },
];
function Stores() {
  const { w } = useSite();
  return (
    <>
      <div className="stores">
        {(["ios", "android"] as const).map((platform) => {
          const available =
            !!storeLinks[platform] && storeAvailability[platform];
          const content = (
            <>
              <StoreIcon platform={platform} />
              <span>
                <small>{available ? w.getApp : w.soon}</small>
                <strong>
                  {platform === "ios" ? "App Store" : "Google Play"}
                </strong>
              </span>
              {storeLinks[platform] && <Arrow diagonal />}
            </>
          );
          return storeLinks[platform] ? (
            <a
              key={platform}
              className={available ? "store-badge" : "store-badge coming-soon"}
              href={storeLinks[platform]}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                browserAnalytics()?.track(
                  available ? "download_click" : "store_open",
                  platform,
                )
              }
            >
              {content}
            </a>
          ) : (
            <div
              key={platform}
              className="store-badge coming-soon"
              aria-label={`${platform === "ios" ? "App Store" : "Google Play"}: ${w.soon}`}
            >
              {content}
            </div>
          );
        })}
      </div>
      {(!storeAvailability.ios || !storeAvailability.android) && (
        <p className="store-notice">{w.storePending}</p>
      )}
    </>
  );
}
export function HomePage() {
  const { w, m, language, href } = useSite();
  const features = [
    { kind: "layers" as const, title: m.emptyTitle, text: m.emptyBody },
    { kind: "chart" as const, title: m.statistics, text: m.monitoringSummary },
    { kind: "shield" as const, title: m.privacyData, text: m.securityNote },
  ];
  return (
    <>
      <Seo page="/" />
      <section className="hero container">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="status-dot" />
            {w.heroKicker}
          </p>
          <h1>
            {w.heroTitle}
            <br />
            <em>{w.heroAccent}</em>
          </h1>
          <p className="lead">{seoCopy[language].description}</p>
          <div className="hero-actions">
            <DemoLink place="hero">{w.demoCta}</DemoLink>
            <a href="#download" className="button text-button">
              {w.getApp}
              <Arrow diagonal />
            </a>
          </div>
          <p className="fineprint">{w.heroNote}</p>
          <div className="hero-platforms">
            <span>iOS</span>
            <span>Android</span>
            {!storeAvailability.ios && !storeAvailability.android && (
              <span>{w.soon}</span>
            )}
          </div>
        </div>
        <div className="hero-visual">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <span className="visual-coordinate top-coordinate" aria-hidden="true">
            01 / {m.overview}
          </span>
          <div className="phone hero-phone">
            <img
              src="/screenshots/overview.png"
              width="390"
              height="844"
              alt={`${m.overview} · ${m.demo}`}
              fetchPriority="high"
            />
          </div>
          <div className="floating-label">
            <span className="status-dot" />
            {m.demo}
          </div>
          <span
            className="visual-coordinate bottom-coordinate"
            aria-hidden="true"
          >
            AIRCAPITAL / iOS + Android
          </span>
        </div>
      </section>
      <section className="exchange-strip container">
        <p>{w.supported}</p>
        <div>
          {exchanges.map((e) => (
            <span key={e.id}>
              <img
                src={`/branding/exchanges/${e.id}.png`}
                width="26"
                height="26"
                alt=""
              />
              {e.name}
            </span>
          ))}
        </div>
      </section>
      <section className="section container">
        <div className="section-heading">
          <p className="eyebrow">AirCapital / 01</p>
          <h2>{w.featureTitle}</h2>
        </div>
        <div className="features">
          {features.map((f, i) => (
            <article key={f.kind} className="feature-card">
              <div className="feature-top">
                <FeatureIcon kind={f.kind} />
                <span>0{i + 1}</span>
              </div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="screens-section section">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">AirCapital / 02</p>
            <h2>{w.screensTitle}</h2>
          </div>
          <div className="screens-grid">
            {(["overview", "exchanges", "statistics"] as const).map(
              (name, i) => (
                <figure key={name}>
                  <figcaption>
                    <span>0{i + 1}</span>
                    <h3>{m[name]}</h3>
                    <Arrow diagonal />
                  </figcaption>
                  <div className="screen-stage">
                    <div className="phone">
                      <img
                        src={`/screenshots/${name}.png`}
                        width="390"
                        height="844"
                        loading="lazy"
                        alt={`${m[name]} · ${m.demo}`}
                      />
                    </div>
                  </div>
                </figure>
              ),
            )}
          </div>
          <p className="fineprint centered">{w.screensCaption}</p>
        </div>
      </section>
      <section className="section container how-section">
        <div className="section-heading">
          <p className="eyebrow">AirCapital / 03</p>
          <h2>{w.howTitle}</h2>
          <DemoLink place="hero" className="button text-button">
            {w.demoCta}
          </DemoLink>
        </div>
        <ol className="steps">
          {[
            { title: m.connect, text: m.instruction },
            { title: m.overview, text: m.emptyBody },
            { title: m.statistics, text: m.background },
          ].map((s, i) => (
            <li key={s.title}>
              <span className="step-number">0{i + 1}</span>
              <div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      <section id="download" className="download-section container">
        <div>
          <p className="eyebrow">AirCapital / iOS + Android</p>
          <h2>{w.downloadTitle}</h2>
          <p>{w.downloadBody}</p>
          <Stores />
          <p className="price-note">{w.priceAnswer}</p>
          <DemoLink place="download" className="button text-button">
            {w.demoCta}
          </DemoLink>
        </div>
        <div className="download-symbol" aria-hidden="true">
          <img src="/branding/icon-512.png" width="200" height="200" alt="" />
        </div>
      </section>
      <section id="privacy" className="privacy-section container">
        <FeatureIcon kind="shield" />
        <div>
          <h2>{w.privacyTitle}</h2>
          <p>{w.privacyBody}</p>
          <a href={href("/faq")} className="inline-link">
            {w.readFaq}
            <Arrow />
          </a>
        </div>
      </section>
    </>
  );
}
export function DemoPage() {
  const { w, m, href } = useSite();
  return (
    <>
      <Seo page="/demo" />
      <section className="page-intro container">
        <p className="eyebrow">
          <span className="status-dot" />
          {m.demo}
        </p>
        <h1>{w.demoTitle}</h1>
        <p className="lead">{w.demoBody}</p>
      </section>
      <div className="container demo-wrap">
        <DemoBoard />
        <p className="demo-disclaimer">
          {m.unsupportedWeb}{" "}
          <a href={href("/") + "#download"}>
            {w.getApp}
            <Arrow diagonal />
          </a>
        </p>
      </div>
    </>
  );
}
export function FaqPage() {
  const { w, m } = useSite();
  const questions = [
    { q: w.faqWhat, a: [m.monitoringSummary] },
    {
      q: w.faqWhich,
      a: [
        m.coverageNote,
        m.coverageBinance,
        m.coverageBybit,
        m.coverageOKX,
        m.coverageBingX,
        m.coverageGate,
      ],
    },
    { q: w.faqSafe, a: [m.instruction, m.securityNote, m.guideSecrets] },
    { q: w.faqWeb, a: [m.unsupportedWeb] },
    { q: w.faqStats, a: [m.flowsUnknown, m.manualFlowsNote] },
    { q: w.faqRefresh, a: [m.background] },
    { q: w.faqPrice, a: [w.priceAnswer] },
    { q: w.faqRelease, a: [w.releaseAnswer] },
  ];
  return (
    <>
      <Seo page="/faq" />
      <section className="page-intro container">
        <p className="eyebrow">AirCapital / {w.faq}</p>
        <h1>{w.faqTitle}</h1>
      </section>
      <div className="faq-layout container">
        <aside>
          <FeatureIcon kind="layers" />
          <p>{m.monitoringSummary}</p>
          <DemoLink place="hero" className="button outline">
            {w.demoCta}
          </DemoLink>
        </aside>
        <div className="faq-list">
          {questions.map((q, i) => (
            <details key={q.q} open={i === 0}>
              <summary>
                <span className="faq-number">0{i + 1}</span>
                <h2>{q.q}</h2>
                <span className="faq-plus" aria-hidden="true">
                  +
                </span>
              </summary>
              <div>
                {q.a.map((a) => (
                  <p key={a}>{a}</p>
                ))}
                {q.q === w.faqRelease && <Stores />}
              </div>
            </details>
          ))}
        </div>
      </div>
    </>
  );
}
export function ContactPage() {
  const { w, language, href } = useSite();
  return (
    <>
      <Seo page="/contact" />
      <section className="page-intro container">
        <p className="eyebrow">AirCapital / {w.contact}</p>
        <h1>{w.contactTitle}</h1>
        <p className="lead">{w.contactBody}</p>
      </section>
      <section className="container contact-grid">
        {[w.support, w.feedback, w.partnerships].map((title, i) => (
          <article className="feature-card" key={title}>
            <div className="feature-top">
              <span>0{i + 1}</span>
              <Arrow diagonal />
            </div>
            <h2>{title}</h2>
            {contactEmail ? (
              <a
                className="inline-link"
                href={`mailto:${contactEmail}`}
                onClick={() =>
                  browserAnalytics()?.track("contact_click", "email")
                }
              >
                {contactEmail}
                <Arrow />
              </a>
            ) : (
              <p className="coming-label">
                <span className="status-dot" />
                {w.contactSoon}
              </p>
            )}
            {telegramLink && (
              <a
                className="inline-link"
                href={telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() =>
                  browserAnalytics()?.track("contact_click", "telegram")
                }
              >
                Telegram
                <Arrow />
              </a>
            )}
          </article>
        ))}
      </section>
      {operator.verified && (
        <section className="container publisher-section">
          <div>
            <h2>{legalLabels[language][4]}</h2>
            <address>
              <strong>{operator.name}</strong>
              <span>
                {operator.address}, {operator.country}
              </span>
            </address>
          </div>
          <nav aria-label={legalLabels[language][4]}>
            {["privacy", "data-deletion", "legal"].map((slug, i) => (
              <a className="inline-link" key={slug} href={`/${slug}`}>
                {legalLabels[language][[0, 3, 4][i]]}
                <Arrow />
              </a>
            ))}
          </nav>
        </section>
      )}
      <div className="container contact-note">
        <p>{w.faqTitle}</p>
        <a className="button outline" href={href("/faq")}>
          {w.readFaq}
          <Arrow />
        </a>
      </div>
    </>
  );
}
