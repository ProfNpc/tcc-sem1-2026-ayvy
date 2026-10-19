import { useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE_URL, authenticateClient } from './api';

export default function LoginScreen({ onLogin }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function entrar() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setErro('Digite um e-mail válido.');
      return;
    }
    if (!senha) {
      setErro('Digite sua senha.');
      return;
    }

    setErro('');
    setLoading(true);
    try {
      onLogin(await authenticateClient(email.trim(), senha));
    } catch (error) {
      setErro(error.message || 'Não foi possível entrar.');
      setLoading(false);
    }
  }

  return (
    <ImageBackground
      source={width > height
        ? require('./assets/fundo-horizontal-ayvy.png')
        : require('./assets/fundo-celular-ayvy.png')}
      resizeMode="cover"
      style={styles.background}
    >
      <StatusBar style="light" />
      <View pointerEvents="none" style={styles.scrim} />
      {/* "padding" também no Android: com a tela de ponta a ponta, é o que sobe o formulário acima do teclado. */}
      <KeyboardAvoidingView behavior="padding" style={styles.keyboardArea}>
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
            width < 360 && styles.compactContent,
            width > height && styles.landscapeContent,
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.container, width < 360 && styles.compactContainer]}>
            <Text style={styles.brand}>AYVY</Text>
            <Text style={styles.titulo}>Entrar</Text>

            <View style={styles.inputBox}>
              <TextInput
                style={styles.input}
                placeholder="E-mail"
                placeholderTextColor="#d8cbd9"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
              />
            </View>

            <View style={[styles.inputBox, styles.passwordBox]}>
              <TextInput
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor="#d8cbd9"
                value={senha}
                onChangeText={setSenha}
                secureTextEntry={!mostrarSenha}
                autoComplete="password"
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                onPress={() => setMostrarSenha((value) => !value)}
                hitSlop={10}
              >
                <Text style={styles.passwordToggle}>{mostrarSenha ? 'Ocultar' : 'Mostrar'}</Text>
              </Pressable>
            </View>

            {erro ? <Text accessibilityRole="alert" style={styles.error}>{erro}</Text> : null}

            <Pressable
              style={({ pressed }) => [styles.botao, pressed && styles.buttonPressed]}
              onPress={entrar}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#34243a" /> : <Text style={styles.textoBotao}>Login</Text>}
            </Pressable>
          </View>

          {/* Mostra a qual API o app está tentando falar: ajuda muito a achar erro de conexão. Pode remover depois. */}
          <Text style={styles.apiInfo}>API: {API_BASE_URL}</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#48214d' },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 7, 19, 0.42)',
  },
  keyboardArea: { flex: 1 },
  content: {
    flexGrow: 1,
    width: '100%',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  compactContent: { paddingHorizontal: 12 },
  landscapeContent: {},
  container: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 430,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.32)',
    borderRadius: 14,
    backgroundColor: 'rgba(27, 12, 32, 0.78)',
    shadowColor: '#100812',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 18,
    elevation: 8,
  },
  compactContainer: { padding: 18 },
  brand: {
    color: '#f1c75b',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  titulo: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  inputBox: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  passwordBox: { paddingRight: 14 },
  input: {
    flex: 1,
    height: '100%',
    padding: 0,
    color: '#fff',
    fontSize: 15,
  },
  passwordToggle: { color: '#f1c75b', fontSize: 12, fontWeight: '700' },
  error: {
    color: '#ffd5d5',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 14,
  },
  botao: {
    height: 50,
    marginTop: 22,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: { opacity: 0.82 },
  textoBotao: { color: '#34243a', fontSize: 16, fontWeight: '700' },
  apiInfo: {
    alignSelf: 'center',
    marginTop: 16,
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 11,
    textAlign: 'center',
  },
});
