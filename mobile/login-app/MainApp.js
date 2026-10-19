import { useEffect, useState } from 'react';
import { BackHandler, Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AccountScreen from './AccountScreen';
import { useCart } from './CartContext';
import CartScreen from './CartScreen';
import HomeScreen from './HomeScreen';
import OrdersScreen from './OrdersScreen';
import TabBar from './TabBar';

// Telas de quem já fez login: a navegação é só uma variável ("tab") que diz qual tela mostrar.
export default function MainApp({ user, onLogout }) {
  const [tab, setTab] = useState('home');
  const { totalCount } = useCart();

  // Botão "voltar" do Android: volta para o Início antes de fechar o app.
  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (tab !== 'home') {
        setTab('home');
        return true;
      }
      return false;
    });
    return () => subscription.remove();
  }, [tab]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* O Início fica sempre montado (só escondido) para não recarregar o catálogo a cada troca de aba. */}
      <View style={[styles.screen, tab !== 'home' && styles.hidden]}>
        <HomeScreen user={user} />
      </View>
      {tab === 'cart' ? (
        <View style={styles.screen}>
          <CartScreen onGoHome={() => setTab('home')} />
        </View>
      ) : null}
      {tab === 'orders' ? (
        <View style={styles.screen}>
          <OrdersScreen user={user} />
        </View>
      ) : null}
      {tab === 'account' ? (
        <View style={styles.screen}>
          <AccountScreen user={user} onLogout={onLogout} />
        </View>
      ) : null}

      <TabBar active={tab} onChange={setTab} cartCount={totalCount} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  screen: { flex: 1 },
  hidden: { display: 'none' },
});
