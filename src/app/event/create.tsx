import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '@/lib/errorMessage';
import { showAlert } from '@/store/alert';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { LocationPickerModal } from '@/components/location-picker-modal';
import { MapView } from '@/components/map-view';
import { PickerField } from '@/components/ui/picker-field';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { useColors } from '@/hooks/useColors';
import { useProfile } from '@/hooks/useProfile';
import { useMySports, useSports } from '@/hooks/useSports';
import { getCoords, useCreateEvent } from '@/hooks/useEvents';
import { PROVINCES, DISTRICTS } from '@/constants/tr-cities';
import { nextDays, shortDate, timeSlots } from '@/lib/datetime';
import { FormSection, Spacing } from '@/constants/theme';

// Konum alınamazsa başlangıç merkezi (İstanbul).
const FALLBACK = { lat: 41.0082, lng: 28.9784 };

/** Bugün için gelecekteki ilk saat slotu (en az 1 saat sonrası). */
function nextSlotIdx(): number {
  const t = Date.now() + 60 * 60 * 1000;
  const now = new Date(t);
  const idx = SLOTS.findIndex((s) => s.h > now.getHours() || (s.h === now.getHours() && s.m >= now.getMinutes()));
  return idx >= 0 ? idx : SLOTS.findIndex((s) => s.h === 18 && s.m === 0);
}

const CAPACITIES: (number | null)[] = [null, 2, 4, 6, 10, 20];
const DAYS = nextDays(8);
const SLOTS = timeSlots();

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
  const [dayIdx, setDayIdx] = useState(0);
  const [slotIdx, setSlotIdx] = useState(nextSlotIdx);
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
    const d = new Date(DAYS[dayIdx]);
    const slot = SLOTS[slotIdx] ?? SLOTS[0];
    d.setHours(slot.h, slot.m, 0, 0);
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
        <View style={styles.row}>
          {mySports.map((s) => (
            <Chip
              key={s.id}
              label={`${s.icon ?? ''} ${s.name}`.trim()}
              selected={sportId === s.id}
              onPress={() => setSportId(sportId === s.id ? null : s.id)}
            />
          ))}
        </View>
      )}

      <Text style={[styles.section, { color: c.text }]}>Gün</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.noGrow} contentContainerStyle={styles.row}>
        {DAYS.map((d, i) => (
          <Chip
            key={i}
            label={i === 0 ? 'Bugün' : i === 1 ? 'Yarın' : shortDate(d)}
            selected={dayIdx === i}
            onPress={() => setDayIdx(i)}
          />
        ))}
      </ScrollView>

      <Text style={[styles.section, { color: c.text }]}>Saat</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.noGrow} contentContainerStyle={styles.row}>
        {SLOTS.map((s, i) => (
          <Chip key={s.label} label={s.label} selected={slotIdx === i} onPress={() => setSlotIdx(i)} />
        ))}
      </ScrollView>

      <Text style={[styles.section, { color: c.text }]}>Kontenjan</Text>
      <View style={styles.row}>
        {CAPACITIES.map((n) => (
          <Chip
            key={String(n)}
            label={n === null ? 'Sınırsız' : `${n} kişi`}
            selected={capacity === n}
            onPress={() => setCapacity(n)}
          />
        ))}
      </View>

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
  noGrow: { flexGrow: 0, flexShrink: 0 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, alignItems: 'center', paddingRight: Spacing.two },
  hint: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: Spacing.two, borderRadius: 12, marginTop: Spacing.three },
  locBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingVertical: Spacing.two, marginTop: Spacing.two },
  locBtnBig: { alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderStyle: 'dashed', borderRadius: 14, paddingVertical: Spacing.four },
});
