import { useRouter } from 'expo-router';
import { Text, type StyleProp, type TextStyle } from 'react-native';

import { useColors } from '@/hooks/useColors';

// #etiket: harf/rakam/_ (Türkçe harfler dahil)
const TAG_RE = /#([\p{L}\p{N}_]{2,40})/gu;

/** Metindeki hashtag'leri ayıklar (küçük harf, tekrarsız). */
export function extractTags(text?: string | null): string[] {
  if (!text) return [];
  return [...new Set([...text.matchAll(TAG_RE)].map((m) => m[1].toLocaleLowerCase('tr')))];
}

type Props = {
  children?: string | null;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
};

/**
 * Kullanıcı metni: kopyalanabilir (uzun bas → kopyala) ve #etiketler dokunulabilir
 * (o etiketi taşıyan gönderiler açılır). Bağlantı oluşturmaz.
 */
export function RichText({ children, style, numberOfLines }: Props) {
  const c = useColors();
  const router = useRouter();
  const text = children ?? '';
  if (!text) return null;

  const parts: { s: string; tag?: string }[] = [];
  let last = 0;
  for (const m of text.matchAll(TAG_RE)) {
    const i = m.index ?? 0;
    if (i > last) parts.push({ s: text.slice(last, i) });
    parts.push({ s: m[0], tag: m[1].toLocaleLowerCase('tr') });
    last = i + m[0].length;
  }
  if (last < text.length) parts.push({ s: text.slice(last) });

  return (
    <Text style={style} selectable numberOfLines={numberOfLines}>
      {parts.map((p, i) =>
        p.tag ? (
          <Text
            key={i}
            style={{ color: c.primary, fontWeight: '700' }}
            onPress={() => router.push(`/tag/${encodeURIComponent(p.tag!)}`)}
            accessibilityRole="button"
            accessibilityLabel={`${p.s} etiketli gönderiler`}>
            {p.s}
          </Text>
        ) : (
          p.s
        ),
      )}
    </Text>
  );
}
