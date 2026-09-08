import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { readBackup } from "../services/backup";
import { requirePro, useBillingStore } from "../billing/store";
import { portfolioReport } from "./csv";
import i18n from "../i18n";

export async function exportReport() {
  await useBillingStore.getState().refresh();
  requirePro();
  const backup = await readBackup();
  if (!backup.snapshots.length) throw new Error("noExport");
  if (!await Sharing.isAvailableAsync()) throw new Error("genericError");
  const labels = Object.fromEntries(["accounts", "from", "to", "opening", "closing", "change",
    "deposits", "withdrawals", "result", "sources", "total", "manualFlows"].map((key) => [key, i18n.t(`monitor.${key}`)]));
  for (const key of ["opening", "closing", "change", "deposits", "withdrawals", "result"])
    labels[key] += " (USDT)";
  const file = new File(Paths.cache, `aircapital-report-${Date.now()}.csv`);
  try {
    file.write(portfolioReport(backup, labels));
    await Sharing.shareAsync(file.uri, { mimeType: "text/csv", UTI: "public.comma-separated-values-text" });
  } finally { if (file.exists) file.delete(); }
}
