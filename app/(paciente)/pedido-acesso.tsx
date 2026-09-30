import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { obterPedido, responderPedido } from '@/src/services/pedido.service';
import { useContagem } from '@/src/hooks/useContagem';
import type { PedidoAcesso } from '@/src/types';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

type Resultado = 'aprovado' | 'negado' | 'expirado' | null;

export default function PedidoAcessoTela() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [pedido, setPedido] = useState<PedidoAcesso | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [aEnviar, setAEnviar] = useState<'aprovado' | 'negado' | null>(null);
  const [resultado, setResultado] = useState<Resultado>(null);

  const segundos = useContagem(pedido?.expiraEm);

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      if (!id) return;
      const dados = await obterPedido(id);
      if (cancelado) return;
      setPedido(dados);
      if (dados && dados.estado !== 'pendente') {
        setResultado(dados.estado === 'aprovado' ? 'aprovado' : dados.estado === 'negado' ? 'negado' : 'expirado');
      }
      setCarregando(false);
    }
    carregar();
    return () => {
      cancelado = true;
    };
  }, [id]);

  // Quando o tempo acaba sem resposta
  // Quando o tempo acaba sem resposta
  useEffect(() => {
    if (!pedido || resultado || aEnviar) return;
    if (Date.now() >= new Date(pedido.expiraEm).getTime()) {
      setResultado('expirado');
    }
  }, [segundos, pedido, resultado, aEnviar]);

  async function responder(estado: 'aprovado' | 'negado') {
    if (!pedido) return;
    setAEnviar(estado);
    await responderPedido(pedido.id, estado);
    setAEnviar(null);
    setResultado(estado);
  }

  function fechar() {
    if (router.canGoBack()) router.back();
    else router.replace('/(paciente)/(tabs)' as any);
  }

  const cabecalho = (
    <View style={[styles.cabecalho, { paddingTop: insets.top + spacing.md }]}>
      <Pressable onPress={fechar} hitSlop={12}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
      </Pressable>
      <Text style={styles.cabecalhoTitulo}>Pedido de Acesso</Text>
      <View style={{ width: 24 }} />
    </View>
  );

  if (carregando) {
    return (
      <View style={styles.container}>
        {cabecalho}
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!pedido) {
    return (
      <View style={styles.container}>
        {cabecalho}
        <View style={styles.centro}>
          <Text style={styles.textoSecundario}>Pedido não encontrado.</Text>
        </View>
      </View>
    );
  }

  const urgente = segundos <= 10;

  return (
    <View style={styles.container}>
      {cabecalho}

      <View style={styles.corpo}>
        {/* Cartão do médico */}
        <View style={styles.cartao}>
          <View style={styles.cartaoTopo}>
            <View style={styles.avatar}>
              <MaterialCommunityIcons name="account" size={36} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.medicoNome}>{pedido.medico.nome}</Text>
              <View style={styles.unidade}>
                <MaterialCommunityIcons name="hospital-building" size={14} color={colors.textSecondary} />
                <Text style={styles.unidadeTexto}>{pedido.medico.unidadeSanitaria}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.descricao}>Solicita acesso completo ao seu histórico clínico.</Text>
        </View>

        <Text style={styles.consentimento}>
          O médico precisa do seu consentimento para visualizar todo o seu histórico.
        </Text>

        {/* Estados */}
        {resultado ? (
          <View style={styles.resultado}>
            <View
              style={[
                styles.resultadoIcone,
                {
                  backgroundColor:
                    resultado === 'aprovado' ? colors.successSoft : resultado === 'negado' ? colors.errorSoft : colors.warningSoft,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={resultado === 'aprovado' ? 'check' : resultado === 'negado' ? 'close' : 'clock-alert-outline'}
                size={36}
                color={resultado === 'aprovado' ? colors.success : resultado === 'negado' ? colors.error : colors.warning}
              />
            </View>
            <Text style={styles.resultadoTitulo}>
              {resultado === 'aprovado' && 'Acesso aprovado'}
              {resultado === 'negado' && 'Acesso negado'}
              {resultado === 'expirado' && 'Pedido expirado'}
            </Text>
            <Text style={styles.resultadoTexto}>
              {resultado === 'aprovado' && `${pedido.medico.nome} já pode ver o seu histórico clínico.`}
              {resultado === 'negado' && `${pedido.medico.nome} não terá acesso ao seu histórico.`}
              {resultado === 'expirado' && 'O tempo para responder terminou. O médico pode enviar um novo pedido.'}
            </Text>
            <Pressable style={[styles.botao, { backgroundColor: colors.primary }]} onPress={fechar}>
              <Text style={styles.botaoTexto}>Voltar ao início</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.botoes}>
              <Pressable
                disabled={!!aEnviar}
                onPress={() => responder('aprovado')}
                style={({ pressed }) => [
                  styles.botao,
                  { backgroundColor: colors.success },
                  (pressed || !!aEnviar) && { opacity: 0.8 },
                ]}
              >
                {aEnviar === 'aprovado' ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.botaoTexto}>Aprovar</Text>
                )}
              </Pressable>

              <Pressable
                disabled={!!aEnviar}
                onPress={() => responder('negado')}
                style={({ pressed }) => [
                  styles.botao,
                  { backgroundColor: colors.error },
                  (pressed || !!aEnviar) && { opacity: 0.8 },
                ]}
              >
                {aEnviar === 'negado' ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.botaoTexto}>Negar</Text>
                )}
              </Pressable>
            </View>

            <View style={[styles.tempo, urgente && styles.tempoUrgente]}>
              <MaterialCommunityIcons
                name="timer-outline"
                size={16}
                color={urgente ? colors.error : colors.textSecondary}
              />
              <Text style={[styles.tempoTexto, urgente && { color: colors.error }]}>
                Pedido válido por {segundos} segundos
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  textoSecundario: { fontFamily: fontFamily.regular, color: colors.textSecondary },
  cabecalho: {
    backgroundColor: colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  cabecalhoTitulo: { fontFamily: fontFamily.semibold, fontSize: 18, color: colors.white },
  corpo: { flex: 1, padding: spacing.xl },
  cartao: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cartaoTopo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicoNome: { fontFamily: fontFamily.semibold, fontSize: 16, color: colors.text },
  unidade: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  unidadeTexto: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.textSecondary },
  descricao: {
    fontFamily: fontFamily.regular,
    fontSize: 15,
    color: colors.text,
    marginTop: spacing.lg,
    lineHeight: 22,
  },
  consentimento: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginTop: spacing.xl,
  },
  botoes: { gap: spacing.md, marginTop: spacing.xl },
  botao: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  botaoTexto: { fontFamily: fontFamily.semibold, fontSize: 16, color: colors.white },
  tempo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'center',
    marginTop: spacing.xl,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tempoUrgente: { backgroundColor: colors.errorSoft, borderColor: colors.errorSoft },
  tempoTexto: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textSecondary },
  resultado: { alignItems: 'center', marginTop: spacing.xxl, gap: spacing.sm },
  resultadoIcone: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  resultadoTitulo: { fontFamily: fontFamily.semibold, fontSize: 20, color: colors.text },
  resultadoTexto: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
});