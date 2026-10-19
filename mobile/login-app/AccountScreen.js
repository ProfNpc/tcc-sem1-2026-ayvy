import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { WEB_BASE_URL, resolveImageUrl } from './api';
import ScreenHeader from './ScreenHeader';
import { openUrl } from './links';
import { confirmAction } from './notify';
import { colors } from './theme';

function LinkRow({ title, description, onPress }) {
  return (
    <Pressable style={({ pressed }) => [styles.row, pressed && styles.pressed]} onPress={onPress} accessibilityRole="link">
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <Text style={styles.rowArrow}>›</Text>
    </Pressable>
  );
}

export default function AccountScreen({ user, onLogout }) {
  const avatar = resolveImageUrl(user.avatarUrl);

  function logout() {
    confirmAction('Sair da conta', 'Deseja sair? Os itens do carrinho do app serão perdidos.', 'Sair', onLogout);
  }

  return (
    <View style={styles.screen}>
      <ScreenHeader title="Minha conta" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profile}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} resizeMode="cover" />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitial}>{String(user.nome || 'A').charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <Text style={styles.name}>{user.nome}</Text>
          <Text style={styles.email}>{user.email}</Text>
          {user.telefone ? <Text style={styles.phone}>{user.telefone}</Text> : null}
        </View>

        <Text style={styles.sectionTitle}>No site da AYVY</Text>
        <Text style={styles.sectionHint}>Estas opções abrem o site no navegador. Você precisará entrar na conta por lá.</Text>
        <View style={styles.group}>
          <LinkRow
            title="Editar meu perfil"
            description="Dados pessoais, endereços e senha"
            onPress={() => openUrl(`${WEB_BASE_URL}/perfil`)}
          />
          <LinkRow
            title="Finalizar uma compra"
            description="Carrinho, frete e pagamento"
            onPress={() => openUrl(`${WEB_BASE_URL}/carrinho`)}
          />
          <LinkRow
            title="Meus pedidos no site"
            description="Acompanhe entregas e detalhes completos"
            onPress={() => openUrl(`${WEB_BASE_URL}/meus-pedidos`)}
          />
        </View>

        <Pressable style={({ pressed }) => [styles.logout, pressed && styles.pressed]} onPress={logout}>
          <Text style={styles.logoutText}>Sair da conta</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 32 },
  profile: { alignItems: 'center', marginBottom: 28 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#eee7ef' },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: colors.primary, fontSize: 38, fontWeight: '700' },
  name: { marginTop: 12, color: colors.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  email: { marginTop: 3, color: colors.muted, fontSize: 14 },
  phone: { marginTop: 2, color: colors.muted, fontSize: 14 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  sectionHint: { marginTop: 3, marginBottom: 10, color: colors.muted, fontSize: 12, lineHeight: 17 },
  group: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowInfo: { flex: 1 },
  rowTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  rowDescription: { marginTop: 2, color: colors.muted, fontSize: 12 },
  rowArrow: { color: colors.primary, fontSize: 24, marginLeft: 8 },
  logout: {
    marginTop: 28,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: { color: colors.danger, fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
