import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { resolveImageUrl } from './api';
import { formatPrice } from './format';
import { colors } from './theme';

// onAdd(product) deve devolver true quando o produto foi mesmo adicionado ao carrinho.
export default function ProductCard({ product, favorite, onToggleFavorite, onAdd }) {
  const [justAdded, setJustAdded] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  const image = resolveImageUrl(product.imagemPrincipalUrl);
  const outOfStock = Number(product.estoque) <= 0;

  function handleAdd() {
    if (onAdd(product)) {
      setJustAdded(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setJustAdded(false), 1200);
    }
  }

  return (
    <View style={styles.card}>
      {image ? (
        <Image source={{ uri: image }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imageFallback]}>
          <Text style={styles.fallbackBrand}>AYVY</Text>
        </View>
      )}

      <Pressable
        style={styles.heart}
        onPress={() => onToggleFavorite(product)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      >
        <Text style={[styles.heartText, favorite && styles.heartActive]}>{favorite ? '♥' : '♡'}</Text>
      </Pressable>

      <Text style={styles.name} numberOfLines={2}>{product.nome || 'Produto'}</Text>
      <Text style={styles.store} numberOfLines={1}>{product.lojista?.nomeLoja || 'AYVY'}</Text>
      <Text style={styles.price}>{formatPrice(product.preco)}</Text>

      <Pressable
        style={({ pressed }) => [
          styles.addButton,
          (outOfStock || justAdded) && styles.addButtonMuted,
          pressed && styles.pressed,
        ]}
        onPress={handleAdd}
        disabled={outOfStock}
      >
        <Text style={[styles.addText, (outOfStock || justAdded) && styles.addTextMuted]}>
          {outOfStock ? 'Esgotado' : justAdded ? 'Adicionado ✓' : 'Adicionar'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 164,
    padding: 9,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  image: { width: '100%', aspectRatio: 0.82, borderRadius: 5, backgroundColor: '#eee7ef' },
  imageFallback: { alignItems: 'center', justifyContent: 'center' },
  fallbackBrand: { color: '#a48ba6', fontSize: 19, fontWeight: '800' },
  heart: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartText: { fontSize: 20, color: colors.muted, lineHeight: 24 },
  heartActive: { color: colors.primary },
  name: { minHeight: 38, marginTop: 9, color: colors.text, fontSize: 13, fontWeight: '600' },
  store: { marginTop: 3, color: colors.muted, fontSize: 11 },
  price: { marginTop: 7, color: colors.primaryDark, fontSize: 14, fontWeight: '800' },
  addButton: {
    marginTop: 9,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonMuted: { backgroundColor: '#eee7ef' },
  addText: { color: colors.onPrimary, fontSize: 13, fontWeight: '700' },
  addTextMuted: { color: colors.muted },
  pressed: { opacity: 0.8 },
});
