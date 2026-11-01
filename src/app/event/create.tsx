import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '@/lib/errorMessage';
import { showAlert } from '@/store/alert';

import { Button } from '@/components/ui/button';
import { CalendarField } from '@/components/ui/calendar-field';
import { LocationPickerModal } from '@/components/location-picker-modal';
import { MapView } from '@/components/map-view';
import { PickerField } from '@/components/ui/picker-field';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { TimeField } from '@/components/ui/time-field';
import { WheelField } from '@/components/ui/wheel-field';
import { useColors } from '@/hooks/useColors';
import { useProfile } from '@/hooks/useProfile';
import { useMySports, useSports } from '@/hooks/useSports';
import { getCoords, useCreateEvent } from '@/hooks/useEvents';
import { PROVINCES, DISTRICTS } from '@/constants/tr-cities';
import { startOfDay } from '@/lib/datetime';
import { FormSection, Spacing } from '@/constants/theme';

// Konum alınamazsa başlangıç merkezi (İstanbul).
const FALLBACK = { lat: 41.0082, lng: 28.9784 };

/** Varsayılan saat: 1 saat sonrası. */
function defaultTime(): { hour: number; minute: number } {
  const t = new Date(Date.now() + 60 * 60 * 1000);
  return { hour: t.getHours(), minute: t.getMinutes() };
}

const CAPACITIES: (number | null)[] = [null, 2, 4, 6, 10, 20];

export default function CreateEventScreen() {
  const c = useColors();
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: sports } = useSports();
  const create = useCreateEvent();

  const mySports = useMySports(profile, sports);

  const [title, setTitle] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [description, setDescription] = useState('');
  const [sportId, setSportId] = useState<string | null>(null);
  const [eventDate, setEventDate] = useState(() => startOfDay(new Date()));
  const [{ hour, minute }, setTime] = useState(defaultTime);
  const [capacity, setCapacity] = useState<number | null>(null);
  const [center, setCenter] = useState(FALLBACK);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [province, setProvince] = useState<string | null>(null);
  const [district, setDistrict] = useState<string | null>(null);

  // Başlangıçta haritayı kullanıcının mevcut konumuna ortala (seçimi zorunlu değil).
  useEffect(() => {
    let active = true;
    getCoords()
      .then(({ lat, lng }) => {
        if (active) setCenter({ lat, lng });
      })
      .catch(() => {
        /* izin yoksa fallback merkezde kalır */
      });
    return () => {
      active = false;
    };
  }, []);

  // İl/ilçeyi profilden ön-doldur (kullanıcı değiştirmediyse).
  useEffect(() => {
    if (!profile) return;
    setProvince((p) => p ?? profile.province ?? null);
    setDistrict((d) => d ?? profile.district ?? null);
  }, [profile]);

  function buildStartsAt(): Date {
    const d = new Date(eventDate);
    d.setHours(hour, minute, 0, 0);
    return d;
  }

  async function onCreate() {
    if (title.trim().length < 2) {
      showAlert('Eksik', 'Etkinliğe bir başlık ver.');
      return;
    }
    if (!province) {
      showAlert('Şehir', 'Etkinliğin ilini seç (böylece o ildeki sporculara görünür).');
      return;
    }
    if (!coords) {
      showAlert('Konum', 'Haritadan buluşma noktasını seç.');
      return;
    }
    const startsAt = buildStartsAt();
    if (startsAt.getTime() < Date.now() - 5 * 60 * 1000) {
      showAlert('Zaman', 'Geçmiş bir zaman seçemezsin.');
      return;
    }
    const point = coords;
    try {
      const res = await create.mutateAsync({
        sportId,
        title,
        description,
        placeName,
        province,
        district,
        startsAt,
        capacity,
        lat: point.lat,
        lng: point.lng,
      });
      router.replace(`/event/${res.id}`);
    } catch (e) {
      showAlert('Oluşturulamadı', getErrorMessage(e, 'Bir hata oluştu.'));
    }
  }

  return (
    <Screen scroll>
      <Stack.Screen options={{ headerShown: true, title: 'Etkinlik oluştur' }} />

      <TextField label="Başlık" placeholder="Örn. Sabah koşusu" value={title} onChangeText={setTitle} maxLength={120} />

      <View style={{ height: Spacing.two }} />
      <TextField
        label="Buluşma yeri (isim)"
        placeholder="Örn. Maçka Parkı girişi"
        value={placeName}
        onChangeText={setPlaceName}
        maxLength={160}
      />

      <Text style={[styles.section, { color: c.text }]}>Spor</Text>
      {mySports.length === 0 ? (
        <Text style={{ color: c.textSecondary, fontSize: 13 }}>
          Profilinden spor eklersen burada seçebilirsin (isteğe bağlı).
        </Text>
      ) : (
        <WheelField
          title="Spor seç"
          icon="basketball-outline"
          items={[null, ...mySports.map((s) => s.id)]}
          value={sportId}
          renderLabel={(id) => {
            if (id === null) return 'Seçilmedi';
            const s = mySports.find((x) => x.id === id);
            return s ? `${s.icon ?? ''} ${s.name}`.trim() : 'Seçilmedi';
          }}
          onChange={setSportId}
        />
      )}

      <Text style={[styles.section, { color: c.text }]}>Gün</Text>
      <CalendarField value={eventDate} onChange={setEventDate} />

      <Text style={[styles.section, { color: c.text }]}>Saat</Text>
      <TimeField hour={hour} minute={minute} onChange={(h, m) => setTime({ hour: h, minute: m })} />

      <Text style={[styles.section, { color: c.text }]}>Kontenjan</Text>
      <WheelField
        title="Kontenjan seç"
        icon="people-outline"
        items={CAPACITIES}
        value={capacity}
        renderLabel={(n) => (n === null ? 'Sınırsız' : `${n} kişi`)}
        onChange={setCapacity}
      />

      <Text style={[styles.section, { color: c.text }]}>Açıklama (isteğe bağlı)</Text>
      <TextField
        placeholder="Seviye, ekipman, notlar…"
        value={description}
        onChangeText={setDescription}
        multiline
        style={{ height: 90, paddingTop: 12, textAlignVertical: 'top' }}
        maxLength={1000}
      />

      <Text style={[styles.section, { color: c.text }]}>Şehir</Text>
      <View style={{ gap: Spacing.two }}>
        <PickerField
          label="İl"
          value={province}
          placeholder="İl seç"
          options={PROVINCES}
          onChange={(p) => {
            setProvince(p);
            setDistrict(null);
          }}
        />
        <PickerField
          label="İlçe (isteğe bağlı)"
          value={district}
          placeholder={province ? 'İlçe seç' : 'Önce il seç'}
          options={province ? DISTRICTS[province] ?? [] : []}
          onChange={setDistrict}
          disabled={!province}
          disabledHint="Önce il seç"
        />
      </View>

      <Text style={[styles.section, { color: c.text }]}>Buluşma noktası</Text>
      {coords ? (
        <>
          <MapView lat={coords.lat} lng={coords.lng} label={placeName || title || 'Buluşma noktası'} height={180} />
          <Pressable
            onPress={() => setPickerOpen(true)}
            style={[styles.locBtn, { borderColor: c.border }]}
            accessibilityRole="button"
            accessibilityLabel="Konumu değiştir">
            <Ionicons name="location-outline" size={18} color={c.primary} />
            <Text style={{ color: c.primary, fontWeight: '600' }}>Konumu değiştir</Text>
          </Pressable>
        </>
      ) : (
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={[styles.locBtnBig, { backgroundColor: c.backgroundElement, borderColor: c.border }]}
          accessibilityRole="button"
          accessibilityLabel="Haritadan konum seç">
          <Ionicons name="map-outline" size={22} color={c.primary} />
          <Text style={{ color: c.text, fontWeight: '600' }}>Haritadan konum seç</Text>
          <Text style={{ color: c.textSecondary, fontSize: 12 }}>Ara, dokun ya da işareti sürükle</Text>
        </Pressable>
      )}

      <View style={[styles.hint, { backgroundColor: c.backgroundElement }]}>
        <Ionicons name="information-circle-outline" size={16} color={c.textSecondary} />
        <Text style={{ color: c.textSecondary, fontSize: 12, flex: 1 }}>
          Etkinlik herkese açıktır — tanımadığın kişiler katılabilir. Halka açık bir yer seç.
        </Text>
      </View>

      <LocationPickerModal
        visible={pickerOpen}
        lat={(coords ?? center).lat}
        lng={(coords ?? center).lng}
        onClose={() => setPickerOpen(false)}
        onSelect={(lat, lng) => setCoords({ lat, lng })}
      />

      <View style={{ height: Spacing.three }} />
      <Button title="Etkinliği oluştur" onPress={onCreate} loading={create.isPending} />
      <View style={{ height: Spacing.four }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: FormSection,
  hint: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: Spacing.two, borderRadius: 12, marginTop: Spacing.three },
  locBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingVertical: Spacing.two, marginTop: Spacing.two },
  locBtnBig: { alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderStyle: 'dashed', borderRadius: 14, paddingVertical: Spacing.four },
});
