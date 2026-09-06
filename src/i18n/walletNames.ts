const walletKeys: Record<string, string> = {
  spot: "walletSpot",
  funding: "walletFunding",
  fund: "walletFunding",
  "cross margin": "walletCrossMargin",
  cross_margin: "walletCrossMargin",
  margin: "walletCrossMargin",
  "isolated margin": "walletIsolatedMargin",
  isolated_margin: "walletIsolatedMargin",
  "usdⓢ-m futures": "walletUsdFutures",
  "usdt-m futures": "walletUsdFutures",
  "coin-m futures": "walletCoinFutures",
  delivery: "walletCoinFutures",
  earn: "walletEarn",
  options: "walletOptions",
  option: "walletOptions",
  "trading bots": "walletTradingBots",
  quant: "walletTradingBots",
  "copy trading": "walletCopyTrading",
  copytrading: "walletCopyTrading",
  unified: "walletUnified",
  "unified · equity": "walletUnified",
  futures: "walletFutures",
  contract: "walletFutures",
  "futures · equity": "walletFutures",
  trading: "walletTrading",
  "trading · equity": "walletTrading",
  "earn · flexiblesaving": "walletFlexibleSaving",
  "flexible saving": "walletFlexibleSaving",
  "earn · onchain": "walletOnChain",
  "onchain earn": "walletOnChain",
  total: "walletTotal",
};
export function walletNameKey(name: string): string | undefined {
  const key = walletKeys[name.trim().toLowerCase()];
  return key ? `monitor.${key}` : undefined;
}
export function valuationKey(source: string): string | undefined {
  if (source === "Exchange USD equity × Coinbase USD/USDT")
    return "monitor.valuationUSD";
  if (source === "Exchange USDT valuation") return "monitor.valuationUSDT";
}
