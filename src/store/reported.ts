import { create } from 'zustand';

/** Bu oturumda şikayet edilen hedefler (arayüzde "Şikayet edildi" göstermek için). Asıl tekrar engeli sunucudadır. */
type ReportedState = {
  keys: Record<string, true>;
  mark: (key: string) => void;
};

export const useReportedStore = create<ReportedState>()((set) => ({
  keys: {},
  mark: (key) => set((s) => ({ keys: { ...s.keys, [key]: true } })),
}));

/** Şikayet hedefi anahtarı: tür + hedef kimliği (yorum/gönderi/kullanıcı). */
export const reportKey = (type: string, targetId: string) => `${type}:${targetId}`;

export function useIsReported(type: string, targetId: string): boolean {
  return useReportedStore((s) => !!s.keys[reportKey(type, targetId)]);
}
