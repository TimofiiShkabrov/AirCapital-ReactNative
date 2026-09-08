import { useAccountsStore } from "../store/accountsStore";
import { usePortfolioStore } from "../store/portfolioStore";
import { loadAllSnapshots, getSnapshots } from "./balanceHistory";
import { loadFlows } from "./cashFlows";
import { loadArchivedPlans } from "./legacyPlans";
import { waitForAll } from "./loadTask";
import { proAccess } from "../billing/store";
import type { BalanceSnapshot } from "../types/common";
const visibleHistory = (history: BalanceSnapshot[]) => proAccess() ? history :
  history.filter((snapshot) => Date.parse(snapshot.timestamp) >= Date.now() - 30 * 86400000);

function checkAccounts() {
  const state = useAccountsStore.getState();
  if (state.error) throw new Error(state.error);
  return state.accounts;
}
function checkPortfolio() {
  const state = usePortfolioStore.getState();
  if (state.errorMessage) throw new Error(state.errorMessage);
  return state;
}
export async function loadOverviewData() {
  await usePortfolioStore.getState().loadData();
  const portfolio = checkPortfolio();
  // Refresh persists snapshots before history is read.
  const [history, ledger] = await waitForAll([
    loadAllSnapshots(),
    loadFlows(),
  ] as const);
  return {
    accounts: portfolio.accounts,
    observations: portfolio.observations,
    sync: portfolio.sync,
    history: visibleHistory(history),
    ledger,
    lastRefresh: portfolio.lastRefresh,
  };
}
export async function loadAccountData(accountId: string) {
  await usePortfolioStore.getState().loadData();
  const portfolio = checkPortfolio();
  const history = await getSnapshots({ type: "account", accountId });
  const account = portfolio.accounts.find((a) => a.id === accountId);
  if (!account) throw new Error("accountNotFound");
  return {
    account,
    observation: portfolio.observations[accountId],
    sync: portfolio.sync[accountId],
    history: visibleHistory(history),
  };
}
export async function loadFlowsData() {
  const [, ledger] = await waitForAll([
    useAccountsStore.getState().loadAccounts(),
    loadFlows(),
  ] as const);
  return { accounts: checkAccounts(), ledger };
}
export async function loadSettingsData() {
  const [, plans] = await waitForAll([
    useAccountsStore.getState().loadAccounts(),
    loadArchivedPlans(),
  ] as const);
  checkAccounts();
  return { plans };
}
