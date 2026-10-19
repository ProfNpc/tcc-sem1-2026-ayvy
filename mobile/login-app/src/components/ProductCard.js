import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { urlImagem } from '../services/api';
import { formatarPreco } from '../utils/formatarPreco';
import { cores } from '../theme';

// Cartão de um produto. Recebe tudo por "props" e não sabe nada da API:
// quem decide o que acontece nos toques é a tela que usa o cartão.
export default function ProductCard({ produto, favorito, onAlternarFavorito, onAdicionar }) {
  const imagem = urlImagem(produto.imagemPrincipalUrl);

  return (
    <View style={styles.card}>
      {imagem ? (
        <Image source={{ uri: imagem }} style={styles.imagem} resizeMode="cover" />
      ) : (
        <View style={[styles.imagem, styles.semImagem]}>
          <Text style={styles.semImagemTexto}>Sem imagem</Text>
        </View>
      )}

      <View style={styles.info}>
        <View style={styles.linhaTopo}>
          <Text style={styles.nome} numberOfLines={2}>
            {produto.nome}
          </Text>
          <TouchableOpacity
            onPress={onAlternarFavorito}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Text style={[styles.coracao, favorito && styles.coracaoAtivo]}>
              {favorito ? '♥' : '♡'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.preco}>{formatarPreco(produto.preco)}</Text>

        <TouchableOpacity style={styles.botao} onPress={onAdicionar}>
          <Text style={styles.botaoTexto}>Adicionar ao carrinho</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: cores.cartao,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  imagem: {
    width: 120,
    height: 170,
  },
  semImagem: {
    backgroundColor: cores.borda,
    alignItems: 'center',
    justifyContent: 'center',
  },
  semImagemTexto: {
    color: cores.textoSecundario,
    fontSize: 12,
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  linhaTopo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nome: {
    flex: 1,
    color: cores.texto,
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
  },
  coracao: {
    fontSize: 26,
    color: cores.textoSecundario,
  },
  coracaoAtivo: {
    color: cores.destaque,
  },
  preco: {
    color: cores.destaque,
    fontSize: 17,
    fontWeight: '700',
    marginVertical: 6,
  },
  botao: {
    backgroundColor: cores.destaque,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  botaoTexto: {
    color: cores.textoSobreDestaque,
    fontWeight: '700',
    fontSize: 13,
  },
});
