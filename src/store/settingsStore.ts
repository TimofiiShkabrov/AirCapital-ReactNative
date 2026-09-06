import { create } from "zustand";
import { resumeDeletion } from "../services/backup";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n, { LANGUAGE_STORAGE_KEY } from "../i18n";
import { deviceLanguage } from "../i18n/deviceLanguage";
import { initialLanguage, supportedLanguage } from "../i18n/languages";
type Theme = "system" | "light" | "dark";
const SETTINGS_KEY = "aircapital.preferences.v2";
interface SettingsState {
  language: string;
  theme: Theme;
  hideAmounts: boolean;
  lockEnabled: boolean;
  hydrated: boolean;
  error?: string;
  hydrateSettings: () => Promise<void>;
  setLanguage: (code: string) => Promise<void>;
  setTheme: (theme: Theme) => Promise<void>;
  setHideAmounts: (value: boolean) => Promise<void>;
  setLockEnabled: (value: boolean) => Promise<void>;
}
export const useSettingsStore = create<SettingsState>((set, get) => {
  const save = async (
    patch: Partial<
      Pick<SettingsState, "theme" | "hideAmounts" | "lockEnabled">
    >,
  ) => {
    const previous = get();
    const next = {
      theme: previous.theme,
      hideAmounts: previous.hideAmounts,
      lockEnabled: previous.lockEnabled,
      ...patch,
    };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
    set(next);
  };
  return {
    language: "en",
    theme: "system",
    hideAmounts: false,
    lockEnabled: false,
    hydrated: false,
    hydrateSettings: async () => {
      set({ error: undefined });
      try {
        await resumeDeletion();
        const raw = await AsyncStorage.getItem(SETTINGS_KEY);
        const settings = raw ? JSON.parse(raw) : {};
        const lang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
        const language = initialLanguage(lang, deviceLanguage());
        if (lang !== language)
          await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
        await i18n.changeLanguage(language);
        set({
          language,
          theme: ["system", "light", "dark"].includes(settings.theme)
            ? settings.theme
            : "system",
          hideAmounts: settings.hideAmounts === true,
          lockEnabled: settings.lockEnabled === true,
          hydrated: true,
          error: undefined,
        });
      } catch {
        set({ error: "storageError" });
      }
    },
    setLanguage: async (code) => {
      const language = supportedLanguage(code);
      if (!language) return;
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      await i18n.changeLanguage(language);
      set({ language });
    },
    setTheme: (theme) => save({ theme }),
    setHideAmounts: (hideAmounts) => save({ hideAmounts }),
    setLockEnabled: (lockEnabled) => save({ lockEnabled }),
  };
});
