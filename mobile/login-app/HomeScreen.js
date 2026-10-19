import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  addFavorite,
  listCategories,
  listFavorites,
  listProducts,
  listStores,
  removeFavorite,
  resolveImageUrl,
} from './api';
import { useCart } from './CartContext';
import ProductCard from './ProductCard';
import { firstName } from './format';
import { notify } from './notify';
import { colors } from './theme';

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function productIsActive(product) {
  const status = String(product?.status || product?.statusProduto || '').toLowerCase();
  return !status || status === 'ativo';
}

function buildSections(products, categories) {
  const remaining = new Map();
  products.forEach((product) => {
    const key = product?.categoria?.id == null ? 'other' : String(product.categoria.id);
    if (!remaining.has(key)) remaining.set(key, []);
    remaining.get(key).push(product);
  });

  const sections = [];
  (categories || [])
    .filter((category) => category?.ativo !== false && category?.id != null)
    .forEach((category) => {
      const key = String(category.id);
      const items = remaining.get(key) || [];
      if (items.length) {
        sections.push({ id: key, title: category.nome || 'Produtos', products: items });
        remaining.delete(key);
      }
    });

  remaining.forEach((items, key) => {
    if (!items.length) return;
    const title = key === 'other' ? 'Outros' : items[0]?.categoria?.nome || 'Produtos';
    sections.push({ id: key, title, products: items });
  });
  return sections;
}

function StoreCard({ store }) {
  const logo = resolveImageUrl(store.logoUrl);
  return (
    <View style={styles.storeCard}>
      {logo ? (
        <Image source={{ uri: logo }} style={styles.storeLogo} resizeMode="cover" />
      ) : (
        <View style={[styles.storeLogo, styles.logoFallback]}>
          <Text style={styles.logoInitial}>{String(store.nomeLoja || 'A').charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <Text style={styles.storeName} numberOfLines={1}>{store.nomeLoja || 'Loja AYVY'}</Text>
      {store.slug ? <Text style={styles.storeSlug} numberOfLines={1}>@{store.slug}</Text> : null}
    </View>
  );
}

function EmptyMessage({ children }) {
  return <Text style={styles.emptyMessage}>{children}</Text>;
}

export default function HomeScreen({ user }) {
  const insets = useSafeAreaInsets();
  const { addItem } = useCart();
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function loadCatalog() {
      setError('');
      setLoading(true);
      try {
        const [productList, storeList, categoryList, favoriteList] = await Promise.all([
          listProducts(),
          listStores(),
          listCategories().catch(() => []),
          listFavorites(user.id).catch(() => []),
        ]);
        if (cancelled) return;
        setProducts(Array.isArray(productList) ? productList : []);
        setStores(Array.isArray(storeList) ? storeList : []);
        setCategories(Array.isArray(categoryList) ? categoryList : []);
        setFavoriteIds(
          (Array.isArray(favoriteList) ? favoriteList : [])
            .map((favorite) => favorite?.produto?.id)
            .filter((id) => id != null),
        );
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Não foi possível carregar o catálogo.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadCatalog();
    return () => {
      cancelled = true;
    };
  }, [reloadKey, user.id]);

  const normalizedQuery = normalizeText(query);
  const filteredStores = useMemo(
    () =>
      stores.filter((store) => {
        const searchable = normalizeText([store.nomeLoja, store.slug, store.descricao].join(' '));
        return !normalizedQuery || searchable.includes(normalizedQuery);
      }),
    [stores, normalizedQuery],
  );
  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        if (!productIsActive(product)) return false;
        if (!(product?.lojista?.slug || product?.lojista?.id)) return false;
        const searchable = normalizeText([
          product.nome,
          product.descricao,
          product.lojista?.nomeLoja,
          product.lojista?.slug,
        ].join(' '));
        return !normalizedQuery || searchable.includes(normalizedQuery);
      }),
    [products, normalizedQuery],
  );
  const sections = useMemo(
    () => buildSections(filteredProducts, categories),
    [filteredProducts, categories],
  );

  function refresh() {
    setReloadKey((key) => key + 1);
  }

  // O coração muda na hora; se a API falhar, volta ao que era.
  async function toggleFavorite(product) {
    const wasFavorite = favoriteIds.includes(product.id);
    setFavoriteIds((current) =>
      wasFavorite ? current.filter((id) => id !== product.id) : [...current, product.id],
    );
    try {
      if (wasFavorite) await removeFavorite(user.id, product.id);
      else await addFavorite(user.id, product.id);
    } catch (favoriteError) {
      setFavoriteIds((current) =>
        wasFavorite ? [...current, product.id] : current.filter((id) => id !== product.id),
      );
      notify('Favoritos', favoriteError.message || 'Não foi possível atualizar seus favoritos.');
    }
  }

  function addToCart(product) {
    const added = addItem(product);
    if (!added) notify('Estoque', 'Você já adicionou todo o estoque disponível deste produto.');
    return added;
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 14 }]}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.brand}>AYVY</Text>
          <Text style={styles.greeting}>Olá, {firstName(user.nome)}</Text>
        </View>

        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar lojas e produtos"
          placeholderTextColor="#817982"
          returnKeyType="search"
        />

        {error ? (
          <View style={styles.errorPanel}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={refresh}>
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Lojas</Text>
        </View>
        {loading && stores.length === 0 ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : filteredStores.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storeList}>
            {filteredStores.map((store) => <StoreCard key={store.id} store={store} />)}
          </ScrollView>
        ) : (
          <EmptyMessage>{normalizedQuery ? 'Nenhuma loja encontrada.' : 'Nenhuma loja disponível.'}</EmptyMessage>
        )}

        <View style={[styles.sectionHeader, styles.productsHeader]}>
          <Text style={styles.sectionTitle}>Explore produtos</Text>
        </View>
        {loading && products.length === 0 ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : sections.length ? (
          sections.map((section) => (
            <View key={section.id} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{section.title}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productList}>
                {section.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    favorite={favoriteIds.includes(product.id)}
                    onToggleFavorite={toggleFavorite}
                    onAdd={addToCart}
                  />
                ))}
              </ScrollView>
            </View>
          ))
        ) : (
          <EmptyMessage>
            {normalizedQuery ? 'Nenhum produto encontrado.' : 'Nenhum produto ativo disponível no momento.'}
          </EmptyMessage>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 30 },
  header: { paddingHorizontal: 20, marginBottom: 20 },
  brand: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  greeting: { color: colors.text, fontSize: 23, fontWeight: '700', marginTop: 4 },
  search: {
    height: 48,
    marginHorizontal: 20,
    marginBottom: 26,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ded8df',
    borderRadius: 10,
    backgroundColor: colors.card,
    color: colors.text,
    fontSize: 14,
  },
  sectionHeader: { paddingHorizontal: 20, marginBottom: 12 },
  productsHeader: { marginTop: 26 },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
  loader: { paddingVertical: 22 },
  storeList: { paddingHorizontal: 20, gap: 12 },
  storeCard: {
    width: 132,
    minHeight: 156,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  storeLogo: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#eee7ef' },
  logoFallback: { alignItems: 'center', justifyContent: 'center' },
  logoInitial: { color: colors.primary, fontSize: 28, fontWeight: '700' },
  storeName: { width: '100%', marginTop: 10, color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  storeSlug: { width: '100%', marginTop: 3, color: colors.muted, fontSize: 11, textAlign: 'center' },
  categorySection: { marginTop: 18 },
  categoryTitle: { paddingHorizontal: 20, marginBottom: 10, color: '#463b49', fontSize: 16, fontWeight: '700' },
  productList: { paddingHorizontal: 20, gap: 12 },
  emptyMessage: { paddingHorizontal: 20, paddingVertical: 14, color: colors.muted, fontSize: 13 },
  errorPanel: { marginHorizontal: 20, marginBottom: 20, padding: 14, borderRadius: 8, backgroundColor: colors.dangerBg },
  errorText: { color: colors.danger, fontSize: 13, lineHeight: 19 },
  retryButton: { alignSelf: 'flex-start', marginTop: 9 },
  retryText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
});
