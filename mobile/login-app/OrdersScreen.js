import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WEB_BASE_URL, listOrderHistory, listOrderItems, listOrders, resolveImageUrl } from './api';
import ScreenHeader from './ScreenHeader';
import { formatDate, formatDateTime, formatPrice } from './format';
import { openUrl } from './links';
import { colors } from './theme';

// Texto e cores de cada status de pedido (os nomes vêm do enum StatusPedido da API).
const STATUS = {
  aguardando_pagamento: { label: 'Aguardando pagamento', bg: '#fff4d6', fg: '#8a6100' },
  pago: { label: 'Pago', bg: '#e1f4e8', fg: '#1f6b3d' },
  em_separacao: { label: 'Em separação', bg: '#e6eefb', fg: '#2c4f8f' },
  enviado: { label: 'A caminho', bg: '#e6eefb', fg: '#2c4f8f' },
  entregue: { label: 'Entregue', bg: '#e1f4e8', fg: '#1f6b3d' },
  cancelado: { label: 'Cancelado', bg: colors.dangerBg, fg: colors.danger },
  reembolsado: { label: 'Reembolsado', bg: '#eee7ef', fg: colors.primaryDark },
};

function statusInfo(status) {
  const key = String(status || '').toLowerCase();
  return (
    STATUS[key] || {
      label: key ? key.replace(/_/g, ' ') : 'Status indisponível',
      bg: '#eee7ef',
      fg: colors.primaryDark,
    }
  );
}

function OrderDetails({ order, detail }) {
  if (!detail || detail.loading) {
    return <ActivityIndicator style={styles.detailLoader} color={colors.primary} />;
  }
  if (detail.error) {
    return <Text style={styles.detailError}>{detail.error}</Text>;
  }

  return (
    <View style={styles.details}>
      {detail.items.map((item) => {
        const image = resolveImageUrl(item.produto?.imagemPrincipalUrl);
        const variant = [item.cor, item.tamanho].filter(Boolean).join(' · ');
        return (
          <View key={item.id} style={styles.itemRow}>
            {image ? (
              <Image source={{ uri: image }} style={styles.itemThumb} resizeMode="cover" />
            ) : (
              <View style={[styles.itemThumb, styles.itemThumbFallback]} />
            )}
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={2}>{item.produto?.nome || 'Produto'}</Text>
              {variant ? <Text style={styles.itemMeta}>{variant}</Text> : null}
              <Text style={styles.itemMeta}>
                {item.quantidade} × {formatPrice(item.precoUnitario)}
              </Text>
            </View>
            <Text style={styles.itemTotal}>{formatPrice(Number(item.precoUnitario || 0) * Number(item.quantidade || 0))}</Text>
          </View>
        );
      })}

      <View style={styles.summary}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{formatPrice(order.valorSubtotal)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Frete</Text>
          <Text style={styles.summaryValue}>{formatPrice(order.valorFrete)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryTotalLabel}>Total</Text>
          <Text style={styles.summaryTotalValue}>{formatPrice(order.valorTotal)}</Text>
        </View>
      </View>

      {order.codigoRastreio || order.previsaoEntrega ? (
        <View style={styles.shipping}>
          {order.codigoRastreio ? (
            <Text style={styles.shippingText}>
              Rastreio: {order.codigoRastreio}{order.transportadora ? ` (${order.transportadora})` : ''}
            </Text>
          ) : null}
          {order.previsaoEntrega ? (
            <Text style={styles.shippingText}>Previsão de entrega: {formatDate(order.previsaoEntrega)}</Text>
          ) : null}
        </View>
      ) : null}

      {detail.history.length ? (
        <View style={styles.timeline}>
          <Text style={styles.timelineTitle}>Acompanhamento</Text>
          {detail.history.map((event) => (
            <View key={event.id} style={styles.timelineRow}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineInfo}>
                <Text style={styles.timelineText}>
                  {event.descricao || String(event.evento || '').replace(/_/g, ' ').toLowerCase()}
                </Text>
                <Text style={styles.timelineDate}>{formatDateTime(event.criadoEm)}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function OrdersScreen({ user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [details, setDetails] = useState({});

  const load = useCallback(async () => {
    setError('');
    try {
      const list = await listOrders(user.id);
      const sorted = [...(Array.isArray(list) ? list : [])].sort(
        (a, b) => String(b.criadoEm || '').localeCompare(String(a.criadoEm || '')) || b.id - a.id,
      );
      setOrders(sorted);
    } catch (loadError) {
      setError(loadError.message || 'Não foi possível carregar seus pedidos.');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    load();
  }, [load]);

  // Abre/fecha um pedido. Os itens e o acompanhamento só são buscados na primeira vez que ele é aberto.
  async function toggle(order) {
    if (expandedId === order.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(order.id);
    if (details[order.id]?.items) return;

    setDetails((current) => ({ ...current, [order.id]: { loading: true } }));
    try {
      const [items, history] = await Promise.all([
        listOrderItems(order.id),
        listOrderHistory(order.id).catch(() => []),
      ]);
      setDetails((current) => ({
        ...current,
        [order.id]: {
          items: Array.isArray(items) ? items : [],
          history: Array.isArray(history) ? history : [],
        },
      }));
    } catch (detailError) {
      setDetails((current) => ({
        ...current,
        [order.id]: { error: detailError.message || 'Não foi possível carregar os itens.' },
      }));
    }
  }

  function renderOrder({ item: order }) {
    const status = statusInfo(order.status);
    const open = expandedId === order.id;
    return (
      <View style={styles.card}>
        <Pressable style={styles.cardHeader} onPress={() => toggle(order)} accessibilityRole="button">
          <View style={styles.cardHeaderTop}>
            <Text style={styles.orderNumber}>Pedido #{order.id}</Text>
            <View style={[styles.badge, { backgroundColor: status.bg }]}>
              <Text style={[styles.badgeText, { color: status.fg }]}>{status.label}</Text>
            </View>
          </View>
          <View style={styles.cardHeaderBottom}>
            <Text style={styles.orderDate}>{formatDateTime(order.criadoEm)}</Text>
            <Text style={styles.orderTotal}>{formatPrice(order.valorTotal)}</Text>
          </View>
          <Text style={styles.expandHint}>{open ? 'Ocultar detalhes ▲' : 'Ver detalhes ▼'}</Text>
        </Pressable>
        {open ? <OrderDetails order={order} detail={details[order.id]} /> : null}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Meus pedidos" subtitle="Histórico das suas compras" />

      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.primary} />
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            style={styles.outlineButton}
            onPress={() => {
              setLoading(true);
              load();
            }}
          >
            <Text style={styles.outlineButtonText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(order) => String(order.id)}
          renderItem={renderOrder}
          extraData={[expandedId, details]}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={load}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>Você ainda não fez nenhum pedido</Text>
              <Text style={styles.emptyText}>
                As compras são finalizadas no site. Depois de pagar, o pedido aparece aqui.
              </Text>
              <Pressable style={styles.outlineButton} onPress={() => openUrl(`${WEB_BASE_URL}/`)}>
                <Text style={styles.outlineButtonText}>Ir para o site</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: 40 },
  list: { padding: 16, flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 40 },
  errorText: { color: colors.danger, fontSize: 14, textAlign: 'center', marginBottom: 14 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptyText: { marginTop: 6, marginBottom: 18, color: colors.muted, fontSize: 14, textAlign: 'center' },
  outlineButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  outlineButtonText: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  card: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  cardHeader: { padding: 14 },
  cardHeaderTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardHeaderBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  orderNumber: { color: colors.text, fontSize: 16, fontWeight: '800' },
  badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  orderDate: { color: colors.muted, fontSize: 12 },
  orderTotal: { color: colors.primaryDark, fontSize: 16, fontWeight: '800' },
  expandHint: { marginTop: 10, color: colors.primary, fontSize: 12, fontWeight: '700' },
  detailLoader: { paddingVertical: 20 },
  detailError: { padding: 14, color: colors.danger, fontSize: 13 },
  details: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: colors.border },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingTop: 12 },
  itemThumb: { width: 52, height: 64, borderRadius: 5, backgroundColor: '#eee7ef' },
  itemThumbFallback: { borderWidth: 1, borderColor: colors.border },
  itemInfo: { flex: 1, marginHorizontal: 10 },
  itemName: { color: colors.text, fontSize: 13, fontWeight: '600' },
  itemMeta: { marginTop: 2, color: colors.muted, fontSize: 11 },
  itemTotal: { color: colors.text, fontSize: 13, fontWeight: '700' },
  summary: { marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  summaryLabel: { color: colors.muted, fontSize: 13 },
  summaryValue: { color: colors.text, fontSize: 13 },
  summaryTotalLabel: { color: colors.text, fontSize: 14, fontWeight: '800' },
  summaryTotalValue: { color: colors.text, fontSize: 14, fontWeight: '800' },
  shipping: { marginTop: 12, padding: 10, borderRadius: 6, backgroundColor: '#f4eff5' },
  shippingText: { color: colors.primaryDark, fontSize: 12, fontWeight: '600', marginTop: 2 },
  timeline: { marginTop: 14 },
  timelineTitle: { color: colors.text, fontSize: 13, fontWeight: '800', marginBottom: 6 },
  timelineRow: { flexDirection: 'row', marginTop: 6 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 5, marginRight: 10 },
  timelineInfo: { flex: 1 },
  timelineText: { color: colors.text, fontSize: 12 },
  timelineDate: { color: colors.muted, fontSize: 11, marginTop: 1 },
});
