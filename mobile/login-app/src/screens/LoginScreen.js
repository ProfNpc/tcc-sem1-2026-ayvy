import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { cores, espacoTopo } from '../theme';

export default function LoginScreen() {
  const { entrar } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function enviar() {
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      Alert.alert('E-mail inválido', 'Digite um e-mail válido.');
      return;
    }
    if (senha.length === 0) {
      Alert.alert('Senha obrigatória', 'Digite sua senha.');
      return;
    }

    setCarregando(true);
    try {
      await entrar(email.trim(), senha);
      // Se deu certo, o AuthContext guarda o usuário e o App.js troca para a tela principal.
    } catch (e) {
      let mensagem;
      if (e.status === 401) {
        mensagem = 'E-mail ou senha inválidos.';
      } else if (e.amigavel) {
        mensagem = e.message;
      } else if (e.status) {
        mensagem = `O servidor respondeu com erro ${e.status}.`;
      } else {
        mensagem =
          'Não foi possível conectar à API. Confira o endereço em src/config.js e se o celular está na mesma rede do computador.';
      }
      Alert.alert('Não foi possível entrar', mensagem);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.marca}>AYVY</Text>
      <Text style={styles.subtitulo}>Entre para ver os produtos</Text>

      <Text style={styles.rotulo}>E-mail</Text>
      <TextInput
        style={styles.input}
        placeholder="seuemail@exemplo.com"
        placeholderTextColor={cores.textoSecundario}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text style={styles.rotulo}>Senha</Text>
      <TextInput
        style={styles.input}
        placeholder="Sua senha"
        placeholderTextColor={cores.textoSecundario}
        value={senha}
        onChangeText={setSenha}
        secureTextEntry
        autoCapitalize="none"
      />

      <TouchableOpacity
        style={[styles.botao, carregando && styles.botaoDesativado]}
        onPress={enviar}
        disabled={carregando}
      >
        {carregando ? (
          <ActivityIndicator color={cores.textoSobreDestaque} />
        ) : (
          <Text style={styles.botaoTexto}>Entrar</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  conteudo: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: espacoTopo,
    paddingBottom: 32,
  },
  marca: {
    color: cores.destaque,
    fontSize: 44,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitulo: {
    color: cores.textoSecundario,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 32,
  },
  rotulo: {
    color: cores.texto,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: cores.cartao,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 10,
    color: cores.texto,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  botao: {
    backgroundColor: cores.destaque,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  botaoDesativado: {
    opacity: 0.6,
  },
  botaoTexto: {
    color: cores.textoSobreDestaque,
    fontSize: 16,
    fontWeight: '700',
  },
});
