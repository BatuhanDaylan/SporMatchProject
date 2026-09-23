import { create } from 'zustand';

export type AlertButton = {
  text?: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
};

type AlertConfig = { title: string; message?: string; buttons: AlertButton[] };

type AlertState = {
  current: AlertConfig | null;
  hide: () => void;
};

export const useAlertStore = create<AlertState>()((set) => ({
  current: null,
  hide: () => set({ current: null }),
}));

/**
 * `Alert.alert` ile aynı imza — uygulamanın kendi tasarımına uygun (kart, tek vurgu rengi)
 * modal diyalog gösterir. Native OS diyaloğu yerine drop-in değişim için kullanılır.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  useAlertStore.setState({
    current: { title, message, buttons: buttons?.length ? buttons : [{ text: 'Tamam' }] },
  });
}
