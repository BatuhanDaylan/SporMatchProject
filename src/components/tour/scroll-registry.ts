import type { RefObject } from 'react';
import type { ScrollView } from 'react-native';

export type ScrollEntry = { ref: RefObject<ScrollView | null>; offset: { y: number } };

/**
 * Odakta olan kaydırılabilir ekranın ScrollView'u. Tanıtım, ekranın görünür alanı dışındaki bir
 * hedefi (ör. formun altı) görünür yapmak için buradan kaydırır. Ekran odak kazanınca kaydolur.
 */
const stack: ScrollEntry[] = [];

export function registerScroll(entry: ScrollEntry) {
  stack.push(entry);
}

export function unregisterScroll(entry: ScrollEntry) {
  const i = stack.indexOf(entry);
  if (i >= 0) stack.splice(i, 1);
}

export function activeScroll(): ScrollEntry | undefined {
  return stack[stack.length - 1];
}
