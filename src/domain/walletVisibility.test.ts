import { describe, expect, it } from "vitest";
import { isWalletVisible } from "./walletVisibility";
import type { WalletBalance } from "../types/monitor";

const wallet = (
  balanceUSDT?: number,
  status: WalletBalance["status"] = "complete",
): WalletBalance => ({
  id: "wallet",
  name: "Wallet",
  balanceUSDT,
  status,
  assets: [],
});

describe("wallet visibility", () => {
  it.each([0, 0.00299778, 0.00999999])(
    "hides a confirmed balance of %s USDT",
    (balance) => {
      expect(isWalletVisible(wallet(balance))).toBe(false);
    },
  );
  it.each([0.01, 0.010001, 40.3, 221.48])(
    "keeps a balance of %s USDT at or above the boundary",
    (balance) => {
      expect(isWalletVisible(wallet(balance))).toBe(true);
    },
  );
  it("does not hide debts or wallets whose value is not fully known", () => {
    expect(isWalletVisible(wallet(-10))).toBe(true);
    expect(isWalletVisible(wallet(undefined))).toBe(true);
    expect(isWalletVisible(wallet(0, "unpriced"))).toBe(true);
    expect(isWalletVisible(wallet(undefined, "unavailable"))).toBe(true);
  });
});
