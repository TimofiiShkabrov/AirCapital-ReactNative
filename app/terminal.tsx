// Compatibility route for old bookmarks. No trading code is loaded.
import { Redirect } from "expo-router";
export default function RetiredTerminal() {
  return <Redirect href="/settings" />;
}
