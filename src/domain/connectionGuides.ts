import type { Exchange } from "../types/common";
export const CONNECTION_GUIDES: Record<
  Exchange,
  { url: string; kind: "article" | "management"; docs?: string }
> = {
  binance: {
    url: "https://www.binance.com/en/support/faq/detail/360002502072",
    kind: "article",
  },
  bybit: {
    url: "https://www.bybit.com/en/help-center/article/How-to-create-your-API-key",
    kind: "article",
  },
  okx: { url: "https://www.okx.com/help/api-faq", kind: "article" },
  bingx: {
    url: "https://bingx.com/en/account/api/",
    kind: "management",
    docs: "https://bingx-api.github.io/docs-v3/#/en/info",
  },
  gateio: { url: "https://www.gate.com/help/guide/faq/17521", kind: "article" },
};
