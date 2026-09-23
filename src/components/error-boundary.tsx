import { Ionicons } from '@expo/vector-icons';
import { Component, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { useColors } from '@/hooks/useColors';
import { Spacing } from '@/constants/theme';

/** Beklenmeyen render hatasında gösterilen tema-uyumlu ekran. */
function Fallback({ onReset }: { onReset: () => void }) {
  const c = useColors();
  return (
    <View style={[styles.wrap, { backgroundColor: c.background }]}>
      <Ionicons name="alert-circle-outline" size={56} color={c.textSecondary} />
      <Text style={[styles.title, { color: c.text }]}>Bir şeyler ters gitti</Text>
      <Text style={[styles.msg, { color: c.textSecondary }]}>
        Beklenmeyen bir hata oluştu. Tekrar deneyebilir ya da uygulamayı yeniden başlatabilirsin.
      </Text>
      <View style={{ height: Spacing.two }} />
      <Button title="Tekrar Dene" onPress={onReset} />
    </View>
  );
}

type Props = { children: ReactNode };
type State = { hasError: boolean };

/**
 * Alt ağaçtaki render/lifecycle hatalarını yakalar, çökme yerine
 * "tekrar dene" ekranı gösterir. Error boundary'ler sınıf bileşeni olmak zorunda.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // İleride Sentry/crashlytics buraya bağlanabilir.
    if (__DEV__) console.error('ErrorBoundary yakaladı:', error);
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) return <Fallback onReset={this.reset} />;
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: Spacing.four },
  title: { fontSize: 20, fontWeight: '700' },
  msg: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
