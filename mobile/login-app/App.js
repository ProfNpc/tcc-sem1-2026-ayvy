import { useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CartProvider } from './CartContext';
import LoginScreen from './LoginScreen';
import MainApp from './MainApp';
import { MAX_APP_WIDTH, colors } from './theme';

export default function App() {
  const [session, setSession] = useState(null);

  // No navegador o app às vezes não herda a altura da página e fica "encolhido" no canto.
  // Dar à raiz o tamanho exato da janela resolve; no celular isso não é necessário.
  const { width, height } = useWindowDimensions();
  const webSize = Platform.OS === 'web' ? { width, height } : null;

  return (
    // SafeAreaProvider mede as barras do aparelho (status e navegação) para as telas usarem.
    <SafeAreaProvider>
      {/* "backdrop" ocupa a janela toda; "frame" é a coluna do app (no navegador, do tamanho de um celular e centralizada). */}
      <View style={[styles.backdrop, webSize]}>
        <View style={styles.frame}>
          {session ? (
            // Ao sair, o CartProvider é desmontado e o carrinho zera sozinho.
            <CartProvider>
              <MainApp user={session} onLogout={() => setSession(null)} />
            </CartProvider>
          ) : (
            <LoginScreen onLogin={setSession} />
          )}
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Platform.OS === 'web' ? '#e9e4ea' : colors.background,
  },
  frame: {
    flex: 1,
    width: '100%',
    backgroundColor: colors.background,
    ...Platform.select({
      web: {
        maxWidth: MAX_APP_WIDTH,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderColor: colors.border,
      },
    }),
  },
});
