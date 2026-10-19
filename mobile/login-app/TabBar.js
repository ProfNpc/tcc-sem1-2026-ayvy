import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from './theme';

const TABS = [
  { key: 'home', label: 'Início', icon: '🏠' },
  { key: 'cart', label: 'Carrinho', icon: '🛒' },
  { key: 'orders', label: 'Pedidos', icon: '📦' },
  { key: 'account', label: 'Conta', icon: '👤' },
];

export default function TabBar({ active, onChange, cartCount }) {
  const insets = useSafeAreaInsets();
  return (
    // insets.bottom é a altura da barra de navegação do Android (botões ou gesto).
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((tab) => {
        const selected = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onPress={() => onChange(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={tab.label}
          >
            <View>
              <Text style={[styles.icon, !selected && styles.iconInactive]}>{tab.icon}</Text>
              {tab.key === 'cart' && cartCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{cartCount > 99 ? '99+' : cartCount}</Text>
                </View>
              ) : null}
            </View>
            <Text style={[styles.label, selected && styles.labelActive]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 2 },
  icon: { fontSize: 22 },
  iconInactive: { opacity: 0.45 },
  label: { marginTop: 2, fontSize: 11, color: colors.muted, fontWeight: '600' },
  labelActive: { color: colors.primary, fontWeight: '800' },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.onPrimary, fontSize: 10, fontWeight: '800' },
});
