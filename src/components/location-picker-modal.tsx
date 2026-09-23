import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { Button } from '@/components/ui/button';
import { useColors } from '@/hooks/useColors';
import { Spacing } from '@/constants/theme';

type Props = {
  visible: boolean;
  lat: number;
  lng: number;
  onClose: () => void;
  onSelect: (lat: number, lng: number) => void;
};

/**
 * Tam ekran konum seçici — Leaflet + OpenStreetMap (anahtarsız).
 * ScrollView çakışması olmadığı için harita serbestçe kaydırılır/yakınlaştırılır.
 * Üstte adres arama (Nominatim), altta "Bu konumu seç".
 */
export function LocationPickerModal({ visible, lat, lng, onClose, onSelect }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const picked = useRef({ lat, lng });
  const [hasPick, setHasPick] = useState(false);

  const html = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
  html,body,#map{height:100%;margin:0;padding:0}
  #search{position:absolute;top:10px;left:10px;right:10px;z-index:1000;display:flex;gap:6px}
  #q{flex:1;padding:12px 14px;border-radius:10px;border:1px solid #ccc;font-size:15px;background:#fff;color:#111}
  #go{padding:0 16px;border:none;border-radius:10px;background:${c.primary};color:${c.onPrimary};font-size:15px;font-weight:600}
  #err{position:absolute;top:58px;left:10px;right:10px;z-index:1000;background:#0008;color:#fff;padding:8px 12px;border-radius:8px;font-size:13px;display:none}
</style>
</head><body>
<div id="search">
  <input id="q" placeholder="Adres, mekan veya semt ara…" />
  <button id="go">Ara</button>
</div>
<div id="err"></div>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var lat=${lat}, lng=${lng};
  var map=L.map('map',{zoomControl:true,attributionControl:true}).setView([lat,lng],14);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
  var marker=L.marker([lat,lng],{draggable:true}).addTo(map);
  function send(ll){ if(window.ReactNativeWebView){ window.ReactNativeWebView.postMessage(JSON.stringify({lat:ll.lat,lng:ll.lng})); } }
  send(marker.getLatLng());
  map.on('click', function(e){ marker.setLatLng(e.latlng); send(e.latlng); });
  marker.on('dragend', function(){ send(marker.getLatLng()); });

  function showErr(m){ var el=document.getElementById('err'); el.textContent=m; el.style.display='block'; setTimeout(function(){el.style.display='none';},3000); }
  function search(){
    var q=document.getElementById('q').value.trim();
    if(!q) return;
    fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=tr&q='+encodeURIComponent(q))
      .then(function(r){return r.json();})
      .then(function(d){
        if(d && d.length){
          var la=parseFloat(d[0].lat), lo=parseFloat(d[0].lon);
          map.setView([la,lo],15); marker.setLatLng([la,lo]); send({lat:la,lng:lo});
        } else { showErr('Sonuç bulunamadı'); }
      })
      .catch(function(){ showErr('Arama başarısız (internet?)'); });
  }
  document.getElementById('go').addEventListener('click', search);
  document.getElementById('q').addEventListener('keydown', function(e){ if(e.key==='Enter'){ search(); } });
</script>
</body></html>`;

  function onMessage(e: WebViewMessageEvent) {
    try {
      const d = JSON.parse(e.nativeEvent.data);
      if (typeof d.lat === 'number' && typeof d.lng === 'number') {
        picked.current = { lat: d.lat, lng: d.lng };
        setHasPick(true);
      }
    } catch {
      /* yoksay */
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: c.background, paddingTop: insets.top }}>
        <View style={styles.bar}>
          <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Kapat">
            <Ionicons name="close" size={26} color={c.text} />
          </Pressable>
          <Text style={[styles.title, { color: c.text }]}>Buluşma noktası</Text>
          <View style={{ width: 26 }} />
        </View>

        <View style={{ flex: 1 }}>
          <WebView originWhitelist={['*']} source={{ html }} onMessage={onMessage} />
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.two, backgroundColor: c.background }]}>
          <Button
            title={hasPick ? 'Bu konumu seç' : 'Haritadan bir nokta seç'}
            onPress={() => {
              onSelect(picked.current.lat, picked.current.lng);
              onClose();
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  title: { fontSize: 17, fontWeight: '700' },
  footer: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
});
