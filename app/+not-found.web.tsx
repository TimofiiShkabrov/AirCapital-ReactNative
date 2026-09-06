import React from "react";
import Head from "expo-router/head";
import { useSite } from "../src/web/context";
export default function NotFound() {
  const { w } = useSite();
  return (
    <section className="container page-intro">
      <Head>
        <title>404 · AirCapital</title>
        <meta name="robots" content="noindex, follow" />
      </Head>
      <p className="eyebrow">AirCapital</p>
      <h1>404</h1>
      <a href="/" className="button primary">
        {w.home}
      </a>
    </section>
  );
}
