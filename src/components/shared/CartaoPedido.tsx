import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { estadoEfetivo, INFO_ESTADO } from '@/src/utils/pedidos';
import { formatarDataHora } from '@/src/utils/datas';
import type { PedidoAcesso } from '@/src/types';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

export function CartaoPedido({ pedido }: { pedido: PedidoAcesso }) {
  const router = useRouter();
  const estado = estadoEfetivo(pedido);
  const info = INFO_ESTADO[estado];

  function abrir() {
    if (estado === 'pendente') {
      router.push({ pathname: '/(medico)/aguardando-aprovacao', params: { id: pedido.id } } as any);
    } else if (estado === 'aprovado') {
      router.push(`/(medico)/historico/${pedido.paciente.id}` as any);
    }
  }

  const clicavel = estado === 'pendente' || estado === 'aprovado';

  return (
    <Pressable
      onPress={abrir}
      disabled={!clicavel}
      style={({ pressed }) => [styles.cartao, pressed && { opacity: 0.8 }]}
    >
      <View style={styles.avatar}>
        <MaterialCommunityIcons name="account" size={24} color={colors.textSecondary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.nome}>{pedido.paciente.nome}</Text>
        <Text style={styles.meta}>
          {pedido.paciente.codigo} · {formatarDataHora(pedido.criadoEm)}
        </Text>
        <View style={[styles.badge, { backgroundColor: info.fundo }]}>
          <MaterialCommunityIcons name={info.icone} size={13} color={info.cor} />
          <Text style={[styles.badgeTexto, { color: info.cor }]}>{info.label}</Text>
        </View>
      </View>

      {clicavel ? (
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nome: { fontFamily: fontFamily.semibold, fontSize: 15, color: colors.text },
  meta: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  badgeTexto: { fontFamily: fontFamily.medium, fontSize: 12 },
});