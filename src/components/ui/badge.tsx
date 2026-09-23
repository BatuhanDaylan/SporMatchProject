import { Text, View } from 'react-native';

type Props = {
  label: string;
  backgroundColor: string;
  textColor: string;
};

/** Küçük dolgulu durum etiketi (ör. "Katıldın", "Dolu") — kart başlıklarının yanında. */
export function Badge({ label, backgroundColor, textColor }: Props) {
  return (
    <View style={{ backgroundColor, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
      <Text style={{ color: textColor, fontSize: 11, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}
