import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { resolveImageUrl } from './api';
import { colors } from './theme';

// Nomes que a API pode usar para a imagem da loja, do mais provável ao menos provável.
const IMAGE_FIELDS = [
  'logoUrl',
  'logo',
  'fotoPerfilUrl',
  'fotoPerfil',
  'imagemPerfilUrl',
  'avatarUrl',
  'avatar',
  'imagemUrl',
  'imagem',
  'fotoUrl',
  'foto',
];

function textOrEmpty(value) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

// Devolve o caminho da imagem da loja (ex.: /uploads/lojas/x.png) ou '' se não achar.
export function storeImagePath(store) {
  if (!store) return '';

  for (const field of IMAGE_FIELDS) {
    const value = textOrEmpty(store[field]);
    if (value) return value;
  }

  // Segunda tentativa: qualquer campo cujo nome lembre imagem (menos banner/capa).
  const looseField = Object.keys(store).find(
    (key) => /logo|avatar|foto|imagem|image/i.test(key) && !/banner|capa|cover/i.test(key) && textOrEmpty(store[key]),
  );
  if (looseField) return textOrEmpty(store[looseField]);

  // Terceira: a foto de perfil pode estar na conta do lojista.
  return textOrEmpty(store.usuario?.avatarUrl) || textOrEmpty(store.usuario?.fotoPerfilUrl);
}

// Diagnóstico (aparece no console do navegador, F12): avisa só uma vez se a API não mandou imagem nenhuma.
let warnedMissingImage = false;

// Círculo com a imagem da loja; se não houver imagem (ou ela falhar ao carregar), mostra a inicial do nome.
export default function StoreAvatar({ store, size = 72 }) {
  const uri = resolveImageUrl(storeImagePath(store));
  const [failedUri, setFailedUri] = useState('');
  const circle = { width: size, height: size, borderRadius: size / 2 };

  useEffect(() => {
    if (uri || !store || warnedMissingImage) return;
    warnedMissingImage = true;
    console.warn(
      `[Loja sem imagem] "${store.nomeLoja}" não trouxe nenhum campo de imagem reconhecido. Campos recebidos da API: ${Object.keys(store).join(', ')}`,
    );
  }, [uri, store]);

  if (uri && failedUri !== uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.base, circle]}
        resizeMode="cover"
        onError={() => {
          console.warn(`[Loja sem imagem] a imagem não carregou: ${uri} (abra esse endereço no navegador para ver o erro)`);
          setFailedUri(uri);
        }}
      />
    );
  }

  return (
    <View style={[styles.base, styles.fallback, circle]}>
      <Text style={[styles.initial, { fontSize: size * 0.4 }]}>
        {String(store?.nomeLoja || 'A').charAt(0).toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { backgroundColor: '#eee7ef' },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  initial: { color: colors.primary, fontWeight: '700' },
});
