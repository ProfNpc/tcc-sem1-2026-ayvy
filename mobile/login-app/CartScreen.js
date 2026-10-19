import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { resolveImageUrl } from './api';
import { useCart } from './CartContext';
import ScreenHeader from './ScreenHeader';
import { formatPrice } from './format';
import { CHECKOUT_NOTICE, buildCartUrl, openUrl } from './links';
import { confirmAction } from './notify';
import { colors } from './theme';

function CartItemRow({ item, onChangeQuantity, onRemove }) {
  const { product, quantity } = item;
  const image = resolveImageUrl(product.imagemPrincipalUrl);
  const unitPrice = Number(product.preco || 0);

  return (
    <View style={styles.row}>
      {image ? (
        <Image source={{ uri: image }} style={styles.thumb} resizeMode="cover" />
      ) : (
        <View style={[styles.thumb, styles.thumbFallback]}>
          <Text style={styles.thumbBrand}>AYVY</Text>
        </View>
      )}
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={2}>{product.nome || 'Produto'}</Text>
        <Text style={styles.rowStore} numberOfLines={1}>{product.lojista?.nomeLoja || 'AYVY'}</Text>
        <Text style={styles.rowPrice}>{formatPrice(unitPrice * quantity)}</Text>

        <View style={styles.controls}>
          <View style={styles.stepper}>
            <Pressable style={styles.stepButton} onPress={() => onChangeQuantity(product.id, quantity - 1)} hitSlop={6} accessibilityLabel="Diminuir quantidade">
              <Text style={styles.stepText}>−</Text>
            </Pressable>
            <Text style={styles.quantity}>{quantity}</Text>
            <Pressable style={styles.stepButton} onPress={() => onChangeQuantity(product.id, quantity + 1)} hitSlop={6} accessibilityLabel="Aumentar quantidade">
              <Text style={styles.stepText}>+</Text>
            </Pressable>
          </View>
          <Pressable onPress={() => onRemove(product.id)} hitSlop={8}>
            <Text style={styles.remove}>Remover</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

export default function CartScreen({ onGoHome }) {
  const { items, totalCount, totalPrice, setQuantity, removeItem, clearCart } = useCart();

  function checkoutOnSite() {
    confirmAction('Finalizar no site', CHECKOUT_NOTICE, 'Abrir o site', () =>
      openUrl(buildCartUrl(items)),
    );
  }

  function confirmClear() {
    confirmAction('Esvaziar carrinho', 'Remover todos os itens do carrinho?', 'Esvaziar', clearCart);
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader
        title="Carrinho"
        subtitle={totalCount ? `${totalCount} ${totalCount === 1 ? 'item' : 'itens'}` : undefined}
      />

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Seu carrinho está vazio</Text>
          <Text style={styles.emptyText}>Escolha produtos na tela inicial e adicione aqui.</Text>
          <Pressable style={styles.primaryButton} onPress={onGoHome}>
            <Text style={styles.primaryButtonText}>Ver produtos</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => String(item.product.id)}
            renderItem={({ item }) => (
              <CartItemRow item={item} onChangeQuantity={setQuantity} onRemove={removeItem} />
            )}
            contentContainerStyle={styles.list}
          />
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>{formatPrice(totalPrice)}</Text>
            </View>
            <Text style={styles.footnote}>O frete é calculado no site, de acordo com o seu CEP.</Text>
            <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]} onPress={checkoutOnSite}>
              <Text style={styles.primaryButtonText}>Finalizar compra no site</Text>
            </Pressable>
            <Pressable onPress={confirmClear} hitSlop={8} style={styles.clearWrap}>
              <Text style={styles.clear}>Esvaziar carrinho</Text>
            </Pressable>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { padding: 16 },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  thumb: { width: 84, height: 104, borderRadius: 6, backgroundColor: '#eee7ef' },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  thumbBrand: { color: '#a48ba6', fontSize: 14, fontWeight: '800' },
  rowInfo: { flex: 1, marginLeft: 12 },
  rowName: { color: colors.text, fontSize: 14, fontWeight: '600' },
  rowStore: { marginTop: 2, color: colors.muted, fontSize: 11 },
  rowPrice: { marginTop: 6, color: colors.primaryDark, fontSize: 15, fontWeight: '800' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
  },
  stepButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  stepText: { color: colors.primary, fontSize: 20, fontWeight: '700', lineHeight: 24 },
  quantity: { minWidth: 24, textAlign: 'center', color: colors.text, fontSize: 14, fontWeight: '700' },
  remove: { color: colors.danger, fontSize: 12, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  emptyText: { marginTop: 6, marginBottom: 18, color: colors.muted, fontSize: 14, textAlign: 'center' },
  footer: {
    padding: 16,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { color: colors.muted, fontSize: 14 },
  totalValue: { color: colors.text, fontSize: 20, fontWeight: '800' },
  footnote: { marginTop: 4, marginBottom: 12, color: colors.muted, fontSize: 12 },
  primaryButton: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: colors.onPrimary, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.85 },
  clearWrap: { alignSelf: 'center', marginTop: 12 },
  clear: { color: colors.muted, fontSize: 13, fontWeight: '600' },
});
