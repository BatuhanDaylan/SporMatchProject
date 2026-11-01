import type { RefObject } from 'react';
import type { View } from 'react-native';

export type Rect = { x: number; y: number; w: number; h: number };

/**
 * Tanıtım hedeflerinin kaydı. Aynı kimlik birden fazla ekranda olabilir (ör. bellekte kalan
 * sekme ve üstüne itilen ekran); en son kaydolan ölçülür, ekran seçimi adımın `home` kuralıyla yapılır.
 */
const targets = new Map<string, RefObject<View | null>[]>();

export function registerTarget(id: string, ref: RefObject<View | null>) {
  targets.set(id, [...(targets.get(id) ?? []), ref]);
}

export function unregisterTarget(id: string, ref: RefObject<View | null>) {
  const next = (targets.get(id) ?? []).filter((r) => r !== ref);
  if (next.length) targets.set(id, next);
  else targets.delete(id);
}

/** Hedefin pencere koordinatlarındaki konumu; yoksa/ölçülemiyorsa null. */
export function measureTarget(id: string, cb: (rect: Rect | null) => void) {
  const list = targets.get(id);
  const view = list?.[list.length - 1]?.current;
  if (!view) return cb(null);
  view.measureInWindow((x, y, w, h) => {
    if (!(w > 0 && h > 0) || Number.isNaN(x) || Number.isNaN(y)) cb(null);
    else cb({ x, y, w, h });
  });
}
