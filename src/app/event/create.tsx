import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { getErrorMessage } from '@/lib/errorMessage';
import { showAlert } from '@/store/alert';

import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { CalendarField } from '@/components/ui/calendar-field';
import { LocationPickerModal } from '@/components/location-picker-modal';
import { MapView } from '@/components/map-view';
import { PickerField } from '@/components/ui/picker-field';
import { Screen } from '@/components/ui/screen';
import { FieldLabel } from '@/components/ui/field-label';
import { TextField } from '@/components/ui/text-field';
import { TimeField } from '@/components/ui/time-field';
import { WheelField } from '@/components/ui/wheel-field';
import { TourTarget } from '@/components/tour/tour-target';
import { useColors } from '@/hooks/useColors';
import { useProfile } from '@/hooks/useProfile';
import { useMySports, useSports } from '@/hooks/useSports';
import { getCoords, useCreateEvent } from '@/hooks/useEvents';
import { PROVINCES, DISTRICTS } from '@/constants/tr-cities';
import { startOfDay } from '@/lib/datetime';
import { FormSection, Spacing } from '@/constants/theme';

// Konum alınamazsa başlangıç merkezi (İstanbul).
const FALLBACK = { lat: 41.0082, lng: 28.9784 };

/** Etkinlik en erken bu kadar dakika sonra başlayabilir (şu an/geçmiş seçilemez). */
const MIN_LEAD_MIN = 15;

/** Seçilebilecek en erken an: şimdi + 15 dk, 5 dakikaya yuvarlanmış. */
function earliestStart(): Date {
  const t = new Date(Date.now() + MIN_LEAD_MIN * 60 * 1000);
  t.setSeconds(0, 0);
  t.setMinutes(Math.ceil(t.getMinutes() / 5) * 5);
  return t;
}

/** Varsayılan: 1 saat sonrası, 15 dakikaya yuvarlanmış. */
function defaultStart(): Date {
  const t = new Date(Date.now() + 60 * 60 * 1000);
  t.setSeconds(0, 0);
  t.setMinutes(Math.ceil(t.getMinutes() / 15) * 15);
  return t;
}

const QUICK_CAPACITIES = [2, 4, 6, 10, 20];
const MIN_CAPACITY = 2;
const MAX_CAPACITY = 500;

export default function CreateEventScreen() {
  const c = useColors();
  const router = useRouter();
  const { data: profile } = useProfile();
  const { data: sports } = useSports();
  const create = useCreateEvent();

  const mySports = useMySports(profile, sports);
  // Önce kendi sporların, sonra diğerleri (yapmadığın bir spor için de etkinlik açabilirsin)
  const sportOptions = [...mySports, ...(sports ?? []).filter((s) => !mySports.some((m) => m.id === s.id))];

  const [title, setTitle] = useState('');
  const [placeName, setPlaceName] = useState('');
  const [description, setDescription] = useState('');
  const [sportId, setSportId] = useState<string | null>(null);
  const [eventDate, setEventDate] = useState(() => startOfDay(defaultStart()));
  const [{ hour, minute }, setTime] = useState(() => {
    const d = defaultStart();
    return { hour: d.getHours(), minute: d.getMinutes() };
  });
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

  // Bugün seçiliyse saat listesi şu andan (15 dk sonrasından) başlar
  const earliest = earliestStart();
  const isEarliestDay = startOfDay(earliest).getTime() === eventDate.getTime();
  const minTime = isEarliestDay ? { hour: earliest.getHours(), minute: earliest.getMinutes() } : null;

  function onChangeDate(d: Date) {
    setEventDate(d);
    // Bugüne dönüldüyse ve seçili saat geçmişte kaldıysa en erken saate çek
    const e = earliestStart();
    if (startOfDay(e).getTime() === d.getTime() && (hour < e.getHours() || (hour === e.getHours() && minute < e.getMinutes()))) {
      setTime({ hour: e.getHours(), minute: e.getMinutes() });
    }
  }

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
    if (startsAt.getTime() < Date.now() + 10 * 60 * 1000) {
      showAlert('Zaman', 'Seçtiğin saat çok yakın ya da geçmişte kaldı. İleri bir saat seç.');
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
      const msg = getErrorMessage(e, 'Bir hata oluştu.');
      // Ücretsiz etkinlik sınırı (yalnız Pro satıştayken) → Pro ekranına yönlendir
      if (msg.includes('SporMatch Pro')) {
        showAlert('Etkinlik sınırı', msg, [
          { text: 'Vazgeç', style: 'cancel' },
          { text: "Pro'yu gör", onPress: () => router.push('/pro') },
        ]);
      } else {
        showAlert('Oluşturulamadı', msg);
      }
    }
  }

  return (
    <Screen scroll hasHeader>
      <Stack.Screen options={{ headerShown: true, title: 'Etkinlik oluştur' }} />

      <TourTarget id="event.basics" style={{ gap: Spacing.three }}>
      <TextField label="Başlık" placeholder="Örn. Sabah koşusu" value={title} onChangeText={setTitle} maxLength={120} />

      <TextField
        label="Buluşma yeri (isim)"
        placeholder="Örn. Maçka Parkı girişi"
        value={placeName}
        onChangeText={setPlaceName}
        maxLength={160}
      />
      </TourTarget>

      <TourTarget id="event.sport">
      {(
        <WheelField
          label="Spor"
          title="Spor seç"
          icon="basketball-outline"
          items={[null, ...sportOptions.map((s) => s.id)]}
          value={sportId}
          renderLabel={(id) => {
            if (id === null) return 'Seçilmedi';
            const s = sportOptions.find((x) => x.id === id);
            return s ? `${s.icon ?? ''} ${s.name}`.trim() : 'Seçilmedi';
          }}
          onChange={setSportId}
        />
      )}
      </TourTarget>

      <TourTarget id="event.when" style={{ gap: Spacing.three }}>
      <CalendarField label="Gün" value={eventDate} minDate={startOfDay(earliest)} onChange={onChangeDate} />

      <TimeField
        label="Saat"
        hour={hour}
        minute={minute}
        min={minTime}
        onChange={(h, m) => setTime({ hour: h, minute: m })}
      />
      </TourTarget>

      <TourTarget id="event.capacity">
      <FieldLabel text="Kişi sayısı">
        <View style={styles.capChips}>
          <Chip label="Sınırsız" selected={capacity === null} onPress={() => setCapacity(null)} />
          {QUICK_CAPACITIES.map((n) => (
            <Chip key={n} label={String(n)} selected={capacity === n} onPress={() => setCapacity(n)} />
          ))}
        </View>
        <View style={[styles.stepper, { backgroundColor: c.backgroundElement, borderColor: c.border }]}>
          <Pressable
            onPress={() => setCapacity((n) => (n === null || n <= MIN_CAPACITY ? null : n - 1))}
            style={[styles.stepBtn, { backgroundColor: c.background }]}
            accessibilityRole="button"
            accessibilityLabel="Kişi sayısını azalt">
            <Ionicons name="remove" size={22} color={c.text} />
          </Pressable>
          <Text style={[styles.stepValue, { color: c.text }]}>{capacity === null ? 'Sınırsız' : `${capacity} kişi`}</Text>
          <Pressable
            onPress={() => setCapacity((n) => (n === null ? MIN_CAPACITY : Math.min(MAX_CAPACITY, n + 1)))}
            style={[styles.stepBtn, { backgroundColor: c.background }]}
            accessibilityRole="button"
            accessibilityLabel="Kişi sayısını artır">
            <Ionicons name="add" size={22} color={c.text} />
          </Pressable>
        </View>
      </FieldLabel>
      </TourTarget>

      <TextField
        label="Açıklama (isteğe bağlı)"
        placeholder="Seviye, ekipman, notlar…"
        value={description}
        onChangeText={setDescription}
        multiline
        style={{ height: 90, paddingTop: 12, textAlignVertical: 'top' }}
        maxLength={1000}
      />

      <TourTarget id="event.city">
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
      </TourTarget>

      <TourTarget id="event.map" style={{ gap: Spacing.three }}>
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
      </TourTarget>

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
      <TourTarget id="event.submit">
        <Button title="Etkinliği oluştur" onPress={onCreate} loading={create.isPending} />
      </TourTarget>
      <View style={{ height: Spacing.four }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: FormSection,
  hint: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: Spacing.two, borderRadius: 12, marginTop: Spacing.three },
  locBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingVertical: Spacing.two, marginTop: Spacing.two },
  capChips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderRadius: 12, padding: 6, marginTop: Spacing.two },
  stepBtn: { width: 44, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontSize: 16, fontWeight: '700' },
  locBtnBig: { alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderStyle: 'dashed', borderRadius: 14, paddingVertical: Spacing.four },
});
