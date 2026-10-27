import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ProductCard from './ProductCard';
import StoreAvatar from './StoreAvatar';
import { MAX_APP_WIDTH, colors } from './theme';

const SIDE = 20; // margem lateral
const GAP = 12; // espaço entre os cards
const MIN_CARD = 150; // largura mínima de um card; quando cabe mais um, a grade ganha mais uma coluna

// Perfil da loja: imagem, nome, descrição e os produtos dela numa grade que se ajusta à largura da tela.
// Os produtos, favoritos e o carrinho vêm da tela inicial (props), para continuarem iguais nas duas telas.
export default function StoreScreen({ store, products, favoriteIds, onToggleFavorite, onAdd, onBack }) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  // Largura REAL da grade, medida na tela (já sem bordas nem barra de rolagem do navegador).
  // Antes da primeira medição usa uma estimativa.
  const [gridWidth, setGridWidth] = useState(Math.min(windowWidth, MAX_APP_WIDTH));
  const available = Math.max(0, gridWidth - SIDE * 2);
  const columns = Math.max(2, Math.floor((available + GAP) / (MIN_CARD + GAP)));
  const cardWidth = Math.floor((available - GAP * (columns - 1)) / columns);
  const count = products.length;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          style={styles.back}
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Voltar para o início"
        >
          <Text style={styles.backText}>‹ Voltar</Text>
        </Pressable>

        <View style={styles.profile}>
          <StoreAvatar store={store} size={96} />
          <Text style={styles.name}>{store.nomeLoja || 'Loja AYVY'}</Text>
          {store.slug ? <Text style={styles.slug}>@{store.slug}</Text> : null}
          {store.descricao ? <Text style={styles.description}>{store.descricao}</Text> : null}
          <Text style={styles.count}>
            {count === 1 ? '1 produto' : `${count} produtos`}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Produtos da loja</Text>
        {count ? (
          <View
            style={styles.grid}
            onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}
          >
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                style={{ width: cardWidth }}
                favorite={favoriteIds.includes(product.id)}
                onToggleFavorite={onToggleFavorite}
                onAdd={onAdd}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.empty}>Esta loja ainda não tem produtos ativos.</Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 30 },
  back: { alignSelf: 'flex-start', paddingHorizontal: SIDE, paddingVertical: 8 },
  backText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  profile: { alignItems: 'center', paddingHorizontal: SIDE, marginTop: 8, marginBottom: 26 },
  name: { marginTop: 14, color: colors.text, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  slug: { marginTop: 3, color: colors.muted, fontSize: 13 },
  description: { marginTop: 10, color: colors.text, fontSize: 14, lineHeight: 20, textAlign: 'center' },
  count: { marginTop: 10, color: colors.muted, fontSize: 12 },
  sectionTitle: { paddingHorizontal: SIDE, marginBottom: 12, color: colors.text, fontSize: 18, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SIDE, gap: GAP },
  empty: { paddingHorizontal: SIDE, paddingVertical: 14, color: colors.muted, fontSize: 13 },
});
