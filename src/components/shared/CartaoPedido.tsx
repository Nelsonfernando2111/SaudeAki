import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Tocavel } from '@/src/components/anim/Tocavel';
import { Avatar } from '@/src/components/ui/Avatar';
import { Etiqueta } from '@/src/components/ui/Etiqueta';
import { estadoEfetivo, INFO_ESTADO, sessaoProvavelmenteAtiva } from '@/src/utils/pedidos';
import { formatarDiaRelativo } from '@/src/utils/datas';
import type { PedidoAcesso } from '@/src/types';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

/** Abre o ecrã certo para um pedido feito pelo médico */
export function useAbrirPedido() {
  const router = useRouter();
  return (pedido: PedidoAcesso) => {
    const estado = estadoEfetivo(pedido);
    if (estado === 'PENDENTE') {
      router.push({
        pathname: '/(medico)/aguardando-aprovacao',
        params: {
          id: String(pedido.id),
          pacienteId: pedido.pacienteId,
          pacienteNome: pedido.pacienteNome,
          dataExpiracao: pedido.dataExpiracao,
        },
      } as any);
    } else if (sessaoProvavelmenteAtiva(pedido)) {
      router.push(`/(medico)/historico/${pedido.pacienteId}` as any);
    } else {
      router.push(`/(medico)/paciente/${pedido.pacienteId}` as any);
    }
  };
}

export function CartaoPedido({ pedido }: { pedido: PedidoAcesso }) {
  const abrir = useAbrirPedido();
  const estado = estadoEfetivo(pedido);
  const info = INFO_ESTADO[estado];
  const ativo = sessaoProvavelmenteAtiva(pedido);

  return (
    <Tocavel onPress={() => abrir(pedido)} style={styles.cartao} accessibilityRole="button">
      <Avatar nome={pedido.pacienteNome} tagTransicao={`paciente-${pedido.pacienteId}`} />

      <View style={{ flex: 1 }}>
        <Text style={styles.nome}>{pedido.pacienteNome}</Text>
        <Text style={styles.meta}>{formatarDiaRelativo(pedido.dataPedido)}</Text>
        <View style={styles.etiquetas}>
          <Etiqueta texto={info.label} cor={info.cor} fundo={info.fundo} icone={info.icone} />
          {ativo ? (
            <Etiqueta
              texto="Sessão ativa"
              cor={colors.purple}
              fundo={colors.purpleSoft}
              icone="lock-open-outline"
            />
          ) : null}
        </View>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
    </Tocavel>
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
  nome: { fontFamily: fontFamily.semibold, fontSize: 15, color: colors.text },
  meta: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  etiquetas: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm },
});
