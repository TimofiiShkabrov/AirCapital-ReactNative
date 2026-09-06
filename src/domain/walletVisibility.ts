import type { WalletBalance } from "../types/monitor";

/** Hide only confirmed small positive/zero balances, never debt or missing valuations. */
export function isWalletVisible(wallet: WalletBalance): boolean {
  const balance = wallet.balanceUSDT;
  return (
    wallet.status !== "complete" ||
    balance === undefined ||
    !Number.isFinite(balance) ||
    balance < 0 ||
    balance >= 0.01
  );
}
