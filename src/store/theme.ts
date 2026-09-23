import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeState = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
};

/** Kullanıcının tema tercihi (kalıcı). */
export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'system',
      setMode: (mode) => set({ mode }),
    }),
    { name: 'spormatch-theme', storage: createJSONStorage(() => AsyncStorage) },
  ),
);

/** Tercih + sistem ayarını birleştirip 'light' | 'dark' döndürür. */
export function useResolvedScheme(): 'light' | 'dark' {
  const system = useColorScheme();
  const mode = useThemeStore((s) => s.mode);
  if (mode === 'system') return system === 'dark' ? 'dark' : 'light';
  return mode;
}
