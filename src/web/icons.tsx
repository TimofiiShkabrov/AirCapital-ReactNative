import React from "react";
export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={diagonal ? "M6 18 18 6M6 6h12v12" : "M4 12h15m-6-6 6 6-6 6"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function FeatureIcon({ kind }: { kind: "layers" | "chart" | "shield" }) {
  const paths = {
    layers: "m12 3 9 5-9 5-9-5 9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5",
    chart: "M4 4v16h17M7 14l4-4 4 2 5-7",
    shield: "M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3Zm-4 9 3 3 5-6",
  };
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d={paths[kind]}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function StoreIcon({ platform }: { platform: "ios" | "android" }) {
  return platform === "ios" ? (
    <svg
      width="23"
      height="27"
      viewBox="0 0 24 28"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M16.5 4c1-1.2 1.7-2.8 1.5-4-1.5.1-3.2 1-4.2 2.2-1 1.1-1.8 2.7-1.5 4 1.6.1 3.1-.8 4.2-2.2ZM20 14c0-3 2.4-4.5 2.5-4.6-1.4-2-3.6-2.3-4.4-2.3-1.9-.2-3.7 1.1-4.7 1.1-1 0-2.5-1.1-4.1-1-2.1 0-4.1 1.2-5.2 3-2.2 3.8-.6 9.4 1.5 12.5 1 1.5 2.3 3.1 3.9 3 1.6-.1 2.2-1 4.1-1s2.5 1 4.2 1c1.7 0 2.7-1.5 3.8-3 .8-1.2 1.5-2.5 1.8-3.4-.1 0-3.4-1.3-3.4-5.3Z" />
    </svg>
  ) : (
    <svg
      width="23"
      height="27"
      viewBox="0 0 24 28"
      fill="none"
      aria-hidden="true"
    >
      <path d="m3 2 13 12L3 26V2Z" fill="currentColor" />
      <path
        d="m5 1 14 9-3 3L5 1Zm14 10 4 3-4 3-3-3 3-3ZM5 27l14-9-3-3L5 27Z"
        fill="currentColor"
        opacity=".7"
      />
    </svg>
  );
}
