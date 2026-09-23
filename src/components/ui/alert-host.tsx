import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useColors } from '@/hooks/useColors';
import { useAlertStore, type AlertButton } from '@/store/alert';
import { Elevation, Spacing, Type } from '@/constants/theme';

function buttonColor(style: AlertButton['style'], c: ReturnType<typeof useColors>) {
  if (style === 'destructive') return c.danger;
  if (style === 'cancel') return c.textSecondary;
  return c.primary;
}

/**
 * Uygulama genelindeki tek diyalog katmanı — `showAlert()` ile tetiklenir, native
 * `Alert.alert` yerine kart/tek-vurgu-rengi tasarımıyla gösterir. Kökte bir kez mount edilir.
 */
export function AlertHost() {
  const c = useColors();
  const current = useAlertStore((s) => s.current);
  const hide = useAlertStore((s) => s.hide);

  if (!current) return null;

  const stacked = current.buttons.length > 2;

  function press(btn: AlertButton) {
    hide();
    btn.onPress?.();
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={hide} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={hide}>
        <Pressable
          style={[styles.card, Elevation.card, { backgroundColor: c.backgroundElement, borderColor: c.border }]}
          onPress={(e) => e.stopPropagation()}>
          <Text style={[styles.title, { color: c.text }]}>{current.title}</Text>
          {current.message ? <Text style={[styles.message, { color: c.textSecondary }]}>{current.message}</Text> : null}

          <View style={[styles.buttons, stacked && styles.buttonsStacked, { borderTopColor: c.border }]}>
            {current.buttons.map((btn, i) => (
              <Pressable
                key={i}
                onPress={() => press(btn)}
                style={({ pressed }) => [
                  styles.button,
                  !stacked && styles.buttonRow,
                  { opacity: pressed ? 0.6 : 1 },
                  !stacked && i > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: c.border },
                  stacked && i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border },
                ]}
                accessibilityRole="button">
                <Text
                  style={[
                    styles.buttonText,
                    { color: buttonColor(btn.style, c) },
                    btn.style !== 'cancel' && styles.buttonTextEmphasis,
                  ]}>
                  {btn.text ?? 'Tamam'}
                </Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  card: { width: '100%', maxWidth: 340, borderRadius: 18, borderWidth: 1, overflow: 'hidden' },
  title: { ...Type.sectionTitle, paddingHorizontal: Spacing.three, paddingTop: Spacing.three },
  message: { ...Type.body, paddingHorizontal: Spacing.three, paddingTop: 6, paddingBottom: Spacing.three },
  buttons: { flexDirection: 'row', marginTop: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth },
  buttonsStacked: { flexDirection: 'column' },
  button: { height: 46, alignItems: 'center', justifyContent: 'center' },
  buttonRow: { flex: 1 },
  buttonText: { fontSize: 15 },
  buttonTextEmphasis: { fontWeight: '700' },
});
