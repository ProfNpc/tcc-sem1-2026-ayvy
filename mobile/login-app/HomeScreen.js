import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Platform,
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
} from './api';
import { useCart } from './CartContext';
import HorizontalList from './HorizontalList';
import ProductCard from './ProductCard';
import StoreAvatar from './StoreAvatar';
import StoreScreen from './StoreScreen';
import { firstName } from './format';
import { notify } from './notify';
import { colors } from './theme';

const SORT_OPTIONS = [
  { id: 'relevance', label: 'Padrão' },
  { id: 'priceAsc', label: 'Menor preço' },
  { id: 'priceDesc', label: 'Maior preço' },
  { id: 'name', label: 'Nome (A-Z)' },
];

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

// Converte o texto digitado ("10", "10,50", "1.200,50") em número. Vazio ou inválido vira null.
function parsePrice(text) {
  let value = String(text || '').trim();
  if (!value) return null;
  if (value.includes(',')) value = value.replace(/\./g, '').replace(',', '.');
  value = value.replace(/[^0-9.]/g, '');
  if (!value) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function productIsActive(product) {
  const status = String(product?.status || product?.statusProduto || '').toLowerCase();
  return !status || status === 'ativo';
}

function categoryKey(product) {
  return product?.categoria?.id == null ? 'other' : String(product.categoria.id);
}

function belongsToStore(product, store) {
  const owner = product?.lojista;
  if (!owner) return false;
  if (owner.id != null && store.id != null) return String(owner.id) === String(store.id);
  return Boolean(owner.slug) && owner.slug === store.slug;
}

function sortProducts(list, sortBy) {
  if (sortBy === 'priceAsc') return [...list].sort((a, b) => Number(a.preco) - Number(b.preco));
  if (sortBy === 'priceDesc') return [...list].sort((a, b) => Number(b.preco) - Number(a.preco));
  if (sortBy === 'name') {
    return [...list].sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR'));
  }
  return list;
}

function buildSections(products, categories) {
  const remaining = new Map();
  products.forEach((product) => {
    const key = categoryKey(product);
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

function StoreCard({ store, onOpen }) {
  const name = store.nomeLoja || 'Loja AYVY';
  return (
    <Pressable
      onPress={() => onOpen(store)}
      accessibilityRole="button"
      accessibilityLabel={`Abrir a loja ${name}`}
      style={({ pressed }) => [styles.storeCard, pressed && styles.pressed]}
    >
      <StoreAvatar store={store} size={72} />
      <Text style={styles.storeName} numberOfLines={1}>{name}</Text>
      {store.slug ? <Text style={styles.storeSlug} numberOfLines={1}>@{store.slug}</Text> : null}
    </Pressable>
  );
}

function Chip({ label, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
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

  // Loja aberta (perfil da loja). null = mostrando o início normal.
  const [selectedStore, setSelectedStore] = useState(null);

  // Filtros
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [sortBy, setSortBy] = useState('relevance');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);

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
          listFavorites(user.id).catch((favoritesError) => {
            // Não trava o app, mas deixa o motivo no console (F12) para investigar.
            console.warn('Não foi possível carregar os favoritos:', favoritesError.message);
            return [];
          }),
        ]);
        if (cancelled) return;
        setProducts(Array.isArray(productList) ? productList : []);
        setStores(Array.isArray(storeList) ? storeList : []);
        setCategories(Array.isArray(categoryList) ? categoryList : []);
        setFavoriteIds(
          (Array.isArray(favoriteList) ? favoriteList : [])
            .map((favorite) => favorite?.produto?.id ?? favorite?.produtoId)
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

  // Botão "voltar" do Android: fecha o perfil da loja antes de qualquer outra coisa.
  useEffect(() => {
    if (Platform.OS !== 'android' || !selectedStore) return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setSelectedStore(null);
      return true;
    });
    return () => subscription.remove();
  }, [selectedStore]);

  const normalizedQuery = normalizeText(query);
  const minValue = parsePrice(minPrice);
  const maxValue = parsePrice(maxPrice);

  const activeFilterCount =
    (categoryFilter ? 1 : 0) +
    (sortBy !== 'relevance' ? 1 : 0) +
    (minValue != null || maxValue != null ? 1 : 0) +
    (onlyFavorites ? 1 : 0) +
    (onlyInStock ? 1 : 0);

  function clearFilters() {
    setCategoryFilter(null);
    setSortBy('relevance');
    setMinPrice('');
    setMaxPrice('');
    setOnlyFavorites(false);
    setOnlyInStock(false);
  }

  // Categorias que realmente têm produtos ativos (viram os botões do filtro).
  const categoryOptions = useMemo(() => {
    const labels = new Map();
    products.filter(productIsActive).forEach((product) => {
      const key = categoryKey(product);
      if (!labels.has(key)) labels.set(key, key === 'other' ? 'Outros' : product.categoria?.nome || 'Categoria');
    });
    (categories || []).forEach((category) => {
      if (category?.id != null && category?.nome && labels.has(String(category.id))) {
        labels.set(String(category.id), category.nome);
      }
    });
    return [...labels].map(([id, label]) => ({ id, label }));
  }, [products, categories]);

  const filteredStores = useMemo(
    () =>
      stores.filter((store) => {
        const searchable = normalizeText([store.nomeLoja, store.slug, store.descricao].join(' '));
        return !normalizedQuery || searchable.includes(normalizedQuery);
      }),
    [stores, normalizedQuery],
  );

  const filteredProducts = useMemo(() => {
    const list = products.filter((product) => {
      if (!productIsActive(product)) return false;
      if (!(product?.lojista?.slug || product?.lojista?.id)) return false;

      if (normalizedQuery) {
        const searchable = normalizeText([
          product.nome,
          product.descricao,
          product.lojista?.nomeLoja,
          product.lojista?.slug,
        ].join(' '));
        if (!searchable.includes(normalizedQuery)) return false;
      }

      if (categoryFilter && categoryKey(product) !== categoryFilter) return false;

      const price = Number(product.preco);
      if (minValue != null && !(price >= minValue)) return false;
      if (maxValue != null && !(price <= maxValue)) return false;

      if (onlyInStock && !(Number(product.estoque) > 0)) return false;
      if (onlyFavorites && !favoriteIds.includes(product.id)) return false;
      return true;
    });
    return sortProducts(list, sortBy);
  }, [products, normalizedQuery, categoryFilter, minValue, maxValue, onlyInStock, onlyFavorites, favoriteIds, sortBy]);

  const sections = useMemo(
    () => buildSections(filteredProducts, categories),
    [filteredProducts, categories],
  );

  // Produtos ativos da loja aberta (sem os filtros da tela inicial).
  const storeProducts = useMemo(() => {
    if (!selectedStore) return [];
    return products.filter((product) => productIsActive(product) && belongsToStore(product, selectedStore));
  }, [products, selectedStore]);

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
      console.warn('Erro ao atualizar favorito:', favoriteError.message);
      notify('Favoritos', favoriteError.message || 'Não foi possível atualizar seus favoritos.');
    }
  }

  function addToCart(product) {
    const added = addItem(product);
    if (!added) notify('Estoque', 'Você já adicionou todo o estoque disponível deste produto.');
    return added;
  }

  const hasFilters = activeFilterCount > 0;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={selectedStore ? styles.hidden : null}
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

        <View style={styles.searchRow}>
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar lojas e produtos"
            placeholderTextColor="#817982"
            returnKeyType="search"
          />
          <Pressable
            style={[styles.filterButton, (filtersOpen || hasFilters) && styles.filterButtonActive]}
            onPress={() => setFiltersOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityLabel="Abrir filtros"
          >
            <Text style={[styles.filterButtonText, (filtersOpen || hasFilters) && styles.filterButtonTextActive]}>
              {hasFilters ? `Filtros (${activeFilterCount})` : 'Filtros'}
            </Text>
          </Pressable>
        </View>

        {filtersOpen ? (
          <View style={styles.filterPanel}>
            <Text style={styles.filterLabel}>Categoria</Text>
            <View style={styles.chipRow}>
              <Chip label="Todas" selected={!categoryFilter} onPress={() => setCategoryFilter(null)} />
              {categoryOptions.map((option) => (
                <Chip
                  key={option.id}
                  label={option.label}
                  selected={categoryFilter === option.id}
                  onPress={() => setCategoryFilter(categoryFilter === option.id ? null : option.id)}
                />
              ))}
            </View>

            <Text style={styles.filterLabel}>Ordenar por</Text>
            <View style={styles.chipRow}>
              {SORT_OPTIONS.map((option) => (
                <Chip
                  key={option.id}
                  label={option.label}
                  selected={sortBy === option.id}
                  onPress={() => setSortBy(option.id)}
                />
              ))}
            </View>

            <Text style={styles.filterLabel}>Preço (R$)</Text>
            <View style={styles.priceRow}>
              <TextInput
                style={styles.priceInput}
                value={minPrice}
                onChangeText={setMinPrice}
                placeholder="Mínimo"
                placeholderTextColor="#817982"
                keyboardType="decimal-pad"
              />
              <Text style={styles.priceTo}>até</Text>
              <TextInput
                style={styles.priceInput}
                value={maxPrice}
                onChangeText={setMaxPrice}
                placeholder="Máximo"
                placeholderTextColor="#817982"
                keyboardType="decimal-pad"
              />
            </View>

            <Text style={styles.filterLabel}>Mostrar</Text>
            <View style={styles.chipRow}>
              <Chip label="Só favoritos" selected={onlyFavorites} onPress={() => setOnlyFavorites((on) => !on)} />
              <Chip label="Só com estoque" selected={onlyInStock} onPress={() => setOnlyInStock((on) => !on)} />
            </View>

            {hasFilters ? (
              <Pressable style={styles.clearButton} onPress={clearFilters}>
                <Text style={styles.clearText}>Limpar filtros</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorPanel}>
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryButton} onPress={refresh}>
              <Text style={styles.retryText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={[styles.sectionHeader, styles.storesHeader]}>
          <Text style={styles.sectionTitle}>Lojas</Text>
        </View>
        {loading && stores.length === 0 ? (
          <ActivityIndicator style={styles.loader} color={colors.primary} />
        ) : filteredStores.length ? (
          <HorizontalList contentContainerStyle={styles.storeList}>
            {filteredStores.map((store) => (
              <StoreCard key={store.id} store={store} onOpen={setSelectedStore} />
            ))}
          </HorizontalList>
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
              <HorizontalList contentContainerStyle={styles.productList}>
                {section.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    favorite={favoriteIds.includes(product.id)}
                    onToggleFavorite={toggleFavorite}
                    onAdd={addToCart}
                  />
                ))}
              </HorizontalList>
            </View>
          ))
        ) : (
          <EmptyMessage>
            {normalizedQuery || hasFilters
              ? 'Nenhum produto encontrado. Tente mudar a busca ou limpar os filtros.'
              : 'Nenhum produto ativo disponível no momento.'}
          </EmptyMessage>
        )}
      </ScrollView>

      {selectedStore ? (
        <StoreScreen
          store={selectedStore}
          products={storeProducts}
          favoriteIds={favoriteIds}
          onToggleFavorite={toggleFavorite}
          onAdd={addToCart}
          onBack={() => setSelectedStore(null)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  hidden: { display: 'none' },
  content: { paddingBottom: 30 },
  header: { paddingHorizontal: 20, marginBottom: 20 },
  brand: { color: colors.primary, fontSize: 14, fontWeight: '800' },
  greeting: { color: colors.text, fontSize: 23, fontWeight: '700', marginTop: 4 },
  searchRow: { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginBottom: 14 },
  search: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ded8df',
    borderRadius: 10,
    backgroundColor: colors.card,
    color: colors.text,
    fontSize: 14,
  },
  filterButton: {
    height: 48,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#ded8df',
    borderRadius: 10,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterButtonText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  filterButtonTextActive: { color: colors.onPrimary },
  filterPanel: {
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.card,
  },
  filterLabel: { marginTop: 4, marginBottom: 8, color: colors.text, fontSize: 13, fontWeight: '700' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#ded8df',
    borderRadius: 16,
    backgroundColor: colors.card,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.text, fontSize: 13 },
  chipTextSelected: { color: colors.onPrimary, fontWeight: '600' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  priceInput: {
    flex: 1,
    height: 42,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ded8df',
    borderRadius: 8,
    backgroundColor: colors.card,
    color: colors.text,
    fontSize: 14,
  },
  priceTo: { color: colors.muted, fontSize: 13 },
  clearButton: { alignSelf: 'flex-start', paddingVertical: 4 },
  clearText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  sectionHeader: { paddingHorizontal: 20, marginBottom: 12 },
  storesHeader: { marginTop: 12 },
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
  storeName: { width: '100%', marginTop: 10, color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  storeSlug: { width: '100%', marginTop: 3, color: colors.muted, fontSize: 11, textAlign: 'center' },
  pressed: { opacity: 0.8 },
  categorySection: { marginTop: 18 },
  categoryTitle: { paddingHorizontal: 20, marginBottom: 10, color: '#463b49', fontSize: 16, fontWeight: '700' },
  productList: { paddingHorizontal: 20, gap: 12 },
  emptyMessage: { paddingHorizontal: 20, paddingVertical: 14, color: colors.muted, fontSize: 13 },
  errorPanel: { marginHorizontal: 20, marginBottom: 20, padding: 14, borderRadius: 8, backgroundColor: colors.dangerBg },
  errorText: { color: colors.danger, fontSize: 13, lineHeight: 19 },
  retryButton: { alignSelf: 'flex-start', marginTop: 9 },
  retryText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
});
