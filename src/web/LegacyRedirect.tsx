import React, { useEffect } from "react";
import Head from "expo-router/head";
import { useSite } from "./context";
export default function LegacyRedirect() {
  const { w } = useSite();
  useEffect(() => {
    window.location.replace("/demo");
  }, []);
  return (
    <div className="container page-intro">
      <Head>
        <title>Demo · AirCapital</title>
        <meta name="robots" content="noindex, follow" />
      </Head>
      <a href="/demo" className="button primary">
        {w.demoCta}
      </a>
    </div>
  );
}
