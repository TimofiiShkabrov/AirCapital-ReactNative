import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { getAllAccounts } from "./secureStore";
import { loadAllSnapshots } from "./balanceHistory";
import { loadFlows } from "./cashFlows";
export async function exportData(): Promise<void> {
  const [accounts, snapshots, flows] = await Promise.all([
    getAllAccounts(),
    loadAllSnapshots(),
    loadFlows(),
  ]);
  if (!snapshots.length && !flows.flows.length) throw new Error("noExport");
  if (!(await Sharing.isAvailableAsync())) throw new Error("genericError");
  const file = new File(Paths.cache, `aircapital-${Date.now()}.json`);
  try {
    file.write(
      JSON.stringify(
        {
          version: 1,
          exportedAt: new Date().toISOString(),
          quoteCurrency: "USDT",
          accounts: accounts.map(({ id, exchange, label, createdAt }) => ({
            id,
            exchange,
            label,
            createdAt,
          })),
          snapshots,
          flows,
        },
        null,
        2,
      ),
    );
    await Sharing.shareAsync(file.uri, {
      mimeType: "application/json",
      UTI: "public.json",
    });
  } finally {
    if (file.exists) file.delete();
  }
}
