import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { listarProdutos, listarFavoritos, favoritar, desfavoritar } from '../services/api';
import { WEB_URL } from '../config';
import { formatarPreco } from '../utils/formatarPreco';
import { cores, espacoTopo } from '../theme';
import ProductCard from '../components/ProductCard';

export default function HomeScreen() {
  const { usuario, sair } = useAuth();
  const { adicionar, limpar, quantidadeTotal, valorTotal } = useCart();

  const [produtos, setProdutos] = useState([]);
  const [favoritos, setFavoritos] = useState([]); // só os ids dos produtos favoritados
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState(null);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      const [listaProdutos, listaFavoritos] = await Promise.all([
        listarProdutos(),
        listarFavoritos(usuario.id),
      ]);
      // Mostra só produtos à venda: status "ativo" e com estoque.
      setProdutos(listaProdutos.filter((p) => p.status === 'ativo' && p.estoque > 0));
      setFavoritos(listaFavoritos.map((f) => f.produto.id));
    } catch (e) {
      setErro('Não foi possível carregar os produtos. Verifique a conexão com a API.');
    } finally {
      setCarregando(false);
    }
  }, [usuario.id]);

  // Roda uma vez quando a tela aparece.
  useEffect(() => {
    carregar();
  }, [carregar]);

  async function puxarParaAtualizar() {
    setAtualizando(true);
    await carregar();
    setAtualizando(false);
  }

  function tentarDeNovo() {
    setCarregando(true);
    carregar();
  }

  async function alternarFavorito(produto) {
    const jaFavorito = favoritos.includes(produto.id);

    // Atualiza a tela na hora; se a API falhar, desfazemos abaixo.
    setFavoritos((atual) =>
      jaFavorito ? atual.filter((id) => id !== produto.id) : [...atual, produto.id]
    );

    try {
      if (jaFavorito) {
        await desfavoritar(usuario.id, produto.id);
      } else {
        await favoritar(usuario.id, produto.id);
      }
    } catch (e) {
      setFavoritos((atual) =>
        jaFavorito ? [...atual, produto.id] : atual.filter((id) => id !== produto.id)
      );
      Alert.alert('Erro', 'Não foi possível atualizar seus favoritos.');
    }
  }

  function adicionarAoCarrinho(produto) {
    const ok = adicionar(produto);
    if (!ok) {
      Alert.alert('Estoque', 'Você já adicionou todo o estoque disponível deste produto.');
    }
  }

  function pagarNoSite() {
    Alert.alert(
      'Pagamento no site',
      'O pagamento é feito no site da AYVY. Os itens do carrinho do app ainda não são enviados ao site, então você precisará adicioná-los novamente por lá.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Abrir o site',
          onPress: () =>
            Linking.openURL(`${WEB_URL}/carrinho`).catch(() =>
              Alert.alert('Erro', 'Não foi possível abrir o site.')
            ),
        },
      ]
    );
  }

  function sairDoApp() {
    limpar();
    sair();
  }

  const primeiroNome = usuario.nome.split(' ')[0];

  return (
    <View style={styles.container}>
      <View style={styles.cabecalho}>
        <View>
          <Text style={styles.saudacao}>Olá, {primeiroNome}</Text>
          <Text style={styles.subtitulo}>Escolha seus produtos</Text>
        </View>
        <TouchableOpacity onPress={sairDoApp}>
          <Text style={styles.sair}>Sair</Text>
        </TouchableOpacity>
      </View>

      {carregando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={cores.destaque} />
        </View>
      ) : erro ? (
        <View style={styles.centro}>
          <Text style={styles.erroTexto}>{erro}</Text>
          <TouchableOpacity style={styles.botaoSecundario} onPress={tentarDeNovo}>
            <Text style={styles.botaoSecundarioTexto}>Tentar de novo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={produtos}
          keyExtractor={(p) => String(p.id)}
          renderItem={({ item }) => (
            <ProductCard
              produto={item}
              favorito={favoritos.includes(item.id)}
              onAlternarFavorito={() => alternarFavorito(item)}
              onAdicionar={() => adicionarAoCarrinho(item)}
            />
          )}
          contentContainerStyle={styles.lista}
          refreshing={atualizando}
          onRefresh={puxarParaAtualizar}
          ListEmptyComponent={
            <Text style={styles.vazio}>Nenhum produto disponível no momento. Puxe a lista para atualizar.</Text>
          }
        />
      )}

      {quantidadeTotal > 0 && (
        <View style={styles.barraCarrinho}>
          <View>
            <Text style={styles.barraTitulo}>
              {quantidadeTotal} {quantidadeTotal === 1 ? 'item' : 'itens'} no carrinho
            </Text>
            <Text style={styles.barraValor}>{formatarPreco(valorTotal)}</Text>
          </View>
          <TouchableOpacity style={styles.botaoPagar} onPress={pagarNoSite}>
            <Text style={styles.botaoPagarTexto}>Pagar no site</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundo,
  },
  cabecalho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: espacoTopo,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: cores.borda,
  },
  saudacao: {
    color: cores.texto,
    fontSize: 20,
    fontWeight: '700',
  },
  subtitulo: {
    color: cores.textoSecundario,
    fontSize: 13,
    marginTop: 2,
  },
  sair: {
    color: cores.destaque,
    fontSize: 15,
    fontWeight: '600',
  },
  centro: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  erroTexto: {
    color: cores.erro,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  botaoSecundario: {
    borderWidth: 1,
    borderColor: cores.destaque,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  botaoSecundarioTexto: {
    color: cores.destaque,
    fontWeight: '600',
  },
  lista: {
    padding: 16,
  },
  vazio: {
    color: cores.textoSecundario,
    textAlign: 'center',
    marginTop: 40,
  },
  barraCarrinho: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: cores.cartao,
    borderTopWidth: 1,
    borderTopColor: cores.borda,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },
  barraTitulo: {
    color: cores.textoSecundario,
    fontSize: 13,
  },
  barraValor: {
    color: cores.texto,
    fontSize: 18,
    fontWeight: '700',
  },
  botaoPagar: {
    backgroundColor: cores.destaque,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  botaoPagarTexto: {
    color: cores.textoSobreDestaque,
    fontWeight: '700',
    fontSize: 15,
  },
});
