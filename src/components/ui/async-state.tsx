import type { ReactNode } from 'react';

import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { Loading } from '@/components/ui/loading';

type EmptyProps = Parameters<typeof EmptyState>[0];

type Props = {
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  isEmpty?: boolean;
  empty?: EmptyProps;
  children: ReactNode;
};

/**
 * Yükleniyor/hata/boş/içerik dörtlü dallanması — liste ve detay ekranlarında tekrar eden
 * desen. Sıra sabit: loading → error → empty → children. `isError`/`isEmpty` verilmezse o
 * dal atlanır (ör. sadece loading+content kontrolü yapan basit ekranlar için).
 */
export function AsyncState({ isLoading, isError, onRetry, isEmpty, empty, children }: Props) {
  if (isLoading) return <Loading />;
  if (isError) return <ErrorState onRetry={onRetry} />;
  if (isEmpty && empty) return <EmptyState {...empty} />;
  return <>{children}</>;
}
