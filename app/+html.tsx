import React, { type PropsWithChildren } from "react";
import { ScrollViewStyleReset } from "expo-router/html";

export default function RootHtml({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <meta name="theme-color" content="#10151F" />
        <meta
          name="google-site-verification"
          content="hLIytGR4mPnPtP2djAVDIy9Cd6v4CGQ5NiMqytG0kZI"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="64x64"
          href="/branding/favicon.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/branding/apple-touch-icon.png"
        />
        <link rel="manifest" href="/site.webmanifest" />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
