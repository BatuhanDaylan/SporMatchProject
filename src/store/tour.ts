import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type TourId = 'all' | 'discover' | 'match' | 'program' | 'chat' | 'profile';

type TourState = {
  /** Tanıtımı bitiren/atlayan kullanıcıların kimlikleri (cihazda kalıcı). */
  doneFor: string[];
  /** Şu an oynayan tur ve adım (kalıcı değil). */
  active: { id: TourId; index: number } | null;
  markDone: (userId: string) => void;
  start: (id: TourId) => void;
  setIndex: (index: number) => void;
  stop: () => void;
};

/**
 * Etkileşimli uygulama tanıtımının durumu. "Gördü" bilgisi hesap başına ve bu cihazda tutulur;
 * Ayarlar > Yardım'dan her tur (`start`) yeniden başlatılabilir.
 */
export const useTourStore = create<TourState>()(
  persist(
    (set) => ({
      doneFor: [],
      active: null,
      markDone: (userId) =>
        set((s) => (s.doneFor.includes(userId) ? s : { doneFor: [...s.doneFor, userId] })),
      start: (id) => set({ active: { id, index: 0 } }),
      setIndex: (index) => set((s) => (s.active ? { active: { ...s.active, index } } : s)),
      stop: () => set({ active: null }),
    }),
    {
      name: 'spormatch-tour',
      storage: createJSONStorage(() => AsyncStorage),
      // Yalnızca "gördü" listesi saklanır; oynayan tur saklanmaz.
      partialize: (s) => ({ doneFor: s.doneFor }),
    },
  ),
);

/**
 * AsyncStorage okuması bitene kadar false. Okuma bitmeden "tanıtımı hiç görmemiş" sanıp karşılama
 * popup'ını göstermemek için kullanılır.
 */
export function useTourHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useTourStore.persist.hasHydrated());
  useEffect(() => {
    if (useTourStore.persist.hasHydrated()) setHydrated(true);
    return useTourStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);
  return hydrated;
}
