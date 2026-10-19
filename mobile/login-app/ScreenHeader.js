import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from './theme';

// Cabeçalho das telas. insets.top é a altura da barra de status do aparelho,
// assim o título nunca fica por baixo do relógio/bateria (principal ajuste para Android).
export default function ScreenHeader({ title, subtitle }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
      <Text style={styles.brand}>AYVY</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  brand: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  title: { color: colors.text, fontSize: 23, fontWeight: '700', marginTop: 4 },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: 2 },
});
