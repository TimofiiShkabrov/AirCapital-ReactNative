import { useColorScheme } from "react-native";
import { useSettingsStore } from "../../store/settingsStore";
const palettes = {
  light: {
    bg: "#f3f5f8",
    panel: "#ffffff",
    text: "#162237",
    muted: "#526176",
    line: "#dae1eb",
    accent: "#285eca",
    tint: "#eaf0fd",
    positive: "#16674d",
    negative: "#ae3648",
    warning: "#936018",
    track: "#e3e8ef",
  },
  dark: {
    bg: "#10151f",
    panel: "#192130",
    text: "#edf2fa",
    muted: "#a5b2c7",
    line: "#303b4f",
    accent: "#83adff",
    tint: "#263653",
    positive: "#71d5af",
    negative: "#ff9bae",
    warning: "#e6ba77",
    track: "#313e51",
  },
};
export function useMonitorTheme() {
  const selected = useSettingsStore((s) => s.theme),
    system = useColorScheme();
  const mode =
    selected === "system" ? (system === "light" ? "light" : "dark") : selected;
  const language = useSettingsStore((s) => s.language);
  return { ...palettes[mode], mode, rtl: language === "ar" };
}
export type MonitorColors = ReturnType<typeof useMonitorTheme>;
