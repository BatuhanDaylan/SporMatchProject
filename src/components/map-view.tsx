import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { useColors } from '@/hooks/useColors';

type Props = {
  lat: number;
  lng: number;
  label?: string;
  height?: number;
};

/**
 * Anahtarsız/ücretsiz gömülü harita — Leaflet + OpenStreetMap (WebView içinde).
 * Google Maps'in aksine faturalandırma gerektirmez. Verilen konuma marker koyar.
 */
export function MapView({ lat, lng, label = 'Buluşma noktası', height = 220 }: Props) {
  const c = useColors();
  const safeLabel = label.replace(/'/g, '’');

  const html = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>html,body,#map{height:100%;margin:0;padding:0;background:${c.backgroundElement}}</style>
</head><body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var lat=${lat}, lng=${lng};
  var map=L.map('map',{zoomControl:true,attributionControl:true}).setView([lat,lng],15);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(map);
  L.marker([lat,lng]).addTo(map).bindPopup('${safeLabel}').openPopup();
</script>
</body></html>`;

  return (
    <View style={[styles.wrap, { height, borderColor: c.border }]}>
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={{ backgroundColor: c.backgroundElement }}
        scrollEnabled={false}
        androidLayerType="hardware"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderRadius: 14, overflow: 'hidden', borderWidth: 1 },
});
