import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n, { LANGUAGE_STORAGE_KEY } from '../i18n';

interface SettingsState {
  language: string;
  hydrated: boolean;
  hydrateSettings: () => Promise<void>;
  setLanguage: (code: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  language: 'en',
  hydrated: false,

  hydrateSettings: async () => {
    const langRaw = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    const language = langRaw ?? 'en';
    await i18n.changeLanguage(language);
    set({ language, hydrated: true });
  },

  setLanguage: async (code) => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
    await i18n.changeLanguage(code);
    set({ language: code });
  },
}));
