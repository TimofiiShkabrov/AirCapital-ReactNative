import { Directory, File, Paths } from "expo-file-system";
export async function removePrivateFiles(): Promise<void> {
  for (const item of new Directory(Paths.cache).list()) {
    if (item instanceof File && /^aircapital-\d+\.json$/.test(item.name))
      item.delete();
    if (item instanceof Directory && item.name === "DocumentPicker")
      item.delete();
  }
}
