import { Text, View } from 'react-native';

import { Avatar } from '@/components/ui/avatar';
import { useColors } from '@/hooks/useColors';

type Props = {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  subtitle?: string | null;
  c: ReturnType<typeof useColors>;
};

/** Avatar + isim + opsiyonel alt metin — kullanıcı listelerinde tekrarlanan satır. */
export function PersonRow({ name, avatarUrl, size = 44, subtitle, c }: Props) {
  return (
    <>
      <Avatar name={name} url={avatarUrl ?? null} size={size} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontWeight: '700', fontSize: 15 }}>{name}</Text>
        {subtitle ? <Text style={{ color: c.textSecondary, fontSize: 13 }}>{subtitle}</Text> : null}
      </View>
    </>
  );
}
