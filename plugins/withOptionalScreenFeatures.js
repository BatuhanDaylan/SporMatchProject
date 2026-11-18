// Uygulama dikey kilitli (app.json "orientation": "portrait"). Android bu yüzden
// android.hardware.screen.portrait özelliğini ZORUNLU sayıyor; Play Console da bunun bazı
// cihazları (tablet, masaüstü, XR) dışladığını söyleyip incelemeyi engelliyor.
// Burada özelliği açıkça "isteğe bağlı" (required=false) beyan ediyoruz; uygulama yine dikey açılır.
const { withAndroidManifest } = require('@expo/config-plugins');

const FEATURES = ['android.hardware.screen.portrait', 'android.hardware.screen.landscape'];

module.exports = function withOptionalScreenFeatures(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    const list = (manifest['uses-feature'] = manifest['uses-feature'] ?? []);
    for (const name of FEATURES) {
      const existing = list.find((f) => f.$?.['android:name'] === name);
      if (existing) existing.$['android:required'] = 'false';
      else list.push({ $: { 'android:name': name, 'android:required': 'false' } });
    }
    return cfg;
  });
};
