import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * Aşağı çekip yenileme (F5): ekranda kullanılan tüm verileri sunucudan yeniden çeker.
 * Ekrana özel bir yenileme verilmezse varsayılan budur.
 */
export function useRefresh(custom?: () => Promise<unknown> | void) {
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await (custom ? custom() : qc.invalidateQueries({ refetchType: 'active' }));
    } finally {
      setRefreshing(false);
    }
  }

  return { refreshing, onRefresh };
}
