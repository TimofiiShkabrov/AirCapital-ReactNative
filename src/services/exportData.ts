import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { readBackup, serializeBackup } from "./backup";
export async function exportData(): Promise<void> {
  const backup = await readBackup();
  if (
    !backup.accounts.length &&
    !backup.snapshots.length &&
    !backup.flows.flows.length &&
    !backup.archive.length
  )
    throw new Error("noExport");
  if (!(await Sharing.isAvailableAsync())) throw new Error("genericError");
  const file = new File(Paths.cache, `aircapital-${Date.now()}.json`);
  try {
    file.write(serializeBackup(backup));
    await Sharing.shareAsync(file.uri, {
      mimeType: "application/json",
      UTI: "public.json",
    });
  } finally {
    if (file.exists) file.delete();
  }
}
