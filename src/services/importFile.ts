import * as DocumentPicker from "expo-document-picker";
import { File, Paths } from "expo-file-system";
import { MAX_BACKUP_BYTES } from "../domain/backup";
export async function pickBackup(): Promise<string | undefined> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/plain"],
    multiple: false,
    copyToCacheDirectory: true,
  });
  if (result.canceled) return;
  const asset = result.assets[0],
    file = new File(asset.uri);
  try {
    if ((asset.size ?? file.size) > MAX_BACKUP_BYTES)
      throw new Error("backupTooLarge");
    return await file.text();
  } finally {
    // DocumentPicker gives us an app-cache copy, never remove the user's original.
    if (file.uri.startsWith(Paths.cache.uri) && file.exists) file.delete();
  }
}
