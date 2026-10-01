import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { PulsoSucesso } from '@/src/components/anim/PulsoSucesso';
import { Skeleton } from '@/src/components/anim/Skeleton';
import { Avatar } from '@/src/components/ui/Avatar';
import { Button } from '@/src/components/ui/Button';
import { useContagem } from '@/src/hooks/useContagem';
import { useVoltar } from '@/src/hooks/useVoltar';
import { paraErroApi } from '@/src/services/api';
import { aprovarPedido, listarPedidos, negarPedido } from '@/src/services/pedido.service';
import { toast } from '@/src/store/toast.store';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

type Resultado = 'APROVADO' | 'RECUSADO' | 'EXPIRADO' | 'JA_RESPONDIDO';

interface DadosPedido {
  id: string;
  medicoNome: string;
  unidadeSanitariaNome: string;
  dataExpiracao: string;
}

const RESULTADOS: Record<
  Resultado,
  { icone: React.ComponentProps<typeof MaterialCommunityIcons>['name']; cor: string; fundo: string; titulo: string; texto: (m: string) => string }
> = {
  APROVADO: {
    icone: 'check',
    cor: colors.success,
    fundo: colors.successSoft,
    titulo: 'Pedido confirmado',
    texto: (m) => `Confirmou o pedido de ${m}. Todas as consultas ao seu histórico ficam registadas em "Acessos".`,
  },
  RECUSADO: {
    icone: 'close',
    cor: colors.error,
    fundo: colors.errorSoft,
    titulo: 'Pedido recusado',
    texto: (m) => `A sua recusa ficou registada. As consultas de ${m} ao seu histórico continuam a aparecer em "Acessos".`,
  },
  EXPIRADO: {
    icone: 'clock-alert-outline',
    cor: colors.warningText,
    fundo: colors.warningSoft,
    titulo: 'Pedido expirado',
    texto: () => 'O tempo para responder terminou. O médico pode enviar um novo pedido.',
  },
  JA_RESPONDIDO: {
    icone: 'information-outline',
    cor: colors.primary,
    fundo: colors.primarySoft,
    titulo: 'Pedido já respondido',
    texto: () => 'Este pedido já tinha sido respondido.',
  },
};

export default function PedidoAcessoTela() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<Partial<DadosPedido>>();

  const [pedido, setPedido] = useState<DadosPedido | null>(
    params.id && params.dataExpiracao
      ? {
          id: params.id,
          medicoNome: params.medicoNome ?? 'Médico',
          unidadeSanitariaNome: params.unidadeSanitariaNome ?? '',
          dataExpiracao: params.dataExpiracao,
        }
      : null
  );
  const [aEnviar, setAEnviar] = useState<'aprovar' | 'negar' | null>(null);
  const [resposta, setResultado] = useState<Resultado | null>(null);

  const segundos = useContagem(pedido?.dataExpiracao);

  // Aberto sem os dados (ex.: link): procura o pedido nos pendentes
  useEffect(() => {
    if (pedido || !params.id) return;
    listarPedidos({ estado: 'PENDENTE', size: 20 })
      .then((pg) => {
        const p = pg.content.find((x) => String(x.id) === params.id);
        if (p) {
          setPedido({
            id: String(p.id),
            medicoNome: p.medicoNome,
            unidadeSanitariaNome: p.unidadeSanitariaNome ?? '',
            dataExpiracao: p.dataExpiracao,
          });
        } else {
          setResultado('EXPIRADO');
        }
      })
      .catch(() => setResultado('EXPIRADO'));
  }, [pedido, params.id]);

  // Quando o tempo acaba sem resposta
  const resultado: Resultado | null =
    resposta ?? (pedido && !aEnviar && segundos === 0 ? 'EXPIRADO' : null);

  async function responder(acao: 'aprovar' | 'negar') {
    if (!pedido) return;
    setAEnviar(acao);
    try {
      const r = acao === 'aprovar' ? await aprovarPedido(pedido.id) : await negarPedido(pedido.id);
      setResultado(r.estado === 'APROVADO' ? 'APROVADO' : 'RECUSADO');
    } catch (e) {
      const err = paraErroApi(e);
      if (err.status === 410) setResultado('EXPIRADO');
      else if (err.status === 409) setResultado('JA_RESPONDIDO');
      else toast.erro(err.message);
    } finally {
      setAEnviar(null);
    }
  }

  const fechar = useVoltar('/(paciente)/(tabs)');

  const nomeMedico = pedido?.medicoNome ?? 'O médico';

  /* ---------- Resultado ---------- */
  if (resultado) {
    const r = RESULTADOS[resultado];
    return (
      <View style={styles.container}>
        <View style={[styles.resultado, { paddingBottom: insets.bottom + spacing.xl }]}>
          <PulsoSucesso icone={r.icone} cor={r.cor} fundo={r.fundo} />
          <Animated.Text entering={FadeInDown.delay(150)} style={styles.resultadoTitulo}>
            {r.titulo}
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(220)} style={styles.resultadoTexto}>
            {r.texto(nomeMedico)}
          </Animated.Text>
          <Animated.View entering={FadeIn.delay(300)} style={{ alignSelf: 'stretch' }}>
            <Button titulo="Voltar ao início" onPress={fechar} />
          </Animated.View>
        </View>
      </View>
    );
  }

  const urgente = segundos <= 10;

  return (
    <View style={styles.container}>

      <View style={[styles.corpo, { paddingBottom: insets.bottom + spacing.xl }]}>
        {!pedido ? (
          <View style={styles.cartao}>
            <Skeleton largura={56} altura={56} raio={28} />
            <Skeleton largura="60%" altura={16} style={{ marginTop: spacing.md }} />
            <Skeleton largura="40%" altura={12} style={{ marginTop: 8 }} />
          </View>
        ) : (
          <Animated.View entering={FadeInDown.duration(350)} style={styles.cartao}>
            <View style={styles.cartaoTopo}>
              <Avatar nome={pedido.medicoNome} tamanho={56} />
              <View style={{ flex: 1 }}>
                <Text style={styles.medicoNome}>{pedido.medicoNome}</Text>
                <View style={styles.unidade}>
                  <MaterialCommunityIcons name="hospital-building" size={14} color={colors.textSecondary} />
                  <Text style={styles.unidadeTexto}>
                    {pedido.unidadeSanitariaNome || 'Unidade não indicada'}
                  </Text>
                </View>
              </View>
            </View>
            <Text style={styles.descricao}>Pede a sua confirmação para consultar o seu histórico clínico.</Text>
          </Animated.View>
        )}

        <Text style={styles.consentimento}>
          Os médicos podem consultar o seu histórico sem autorização; este pedido serve para
          confirmar que está informado. Cada consulta fica registada em &quot;Acessos&quot;.
        </Text>

        <View style={{ flex: 1 }} />

        <View style={[styles.tempo, urgente && styles.tempoUrgente]}>
          <MaterialCommunityIcons name="timer-outline" size={16} color={urgente ? colors.error : colors.primary} />
          <Text style={[styles.tempoTexto, urgente && { color: colors.error }]}>
            {pedido ? `Responda em ${segundos} segundos` : 'A carregar…'}
          </Text>
          {aEnviar ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        </View>

        <View style={styles.botoes}>
          <Button
            titulo="Aprovar"
            icone="check"
            variante="sucesso"
            onPress={() => responder('aprovar')}
            carregando={aEnviar === 'aprovar'}
            desativado={!pedido || !!aEnviar}
          />
          <Button
            titulo="Negar"
            icone="close"
            variante="perigoContorno"
            onPress={() => responder('negar')}
            carregando={aEnviar === 'negar'}
            desativado={!pedido || !!aEnviar}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  corpo: { flex: 1, padding: spacing.xl },
  cartao: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  cartaoTopo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  medicoNome: { fontFamily: fontFamily.semibold, fontSize: 16, color: colors.primaryDark },
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
  tempo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primaryFaint,
    marginBottom: spacing.lg,
  },
  tempoUrgente: { backgroundColor: colors.errorSoft },
  tempoTexto: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.primary },
  botoes: { gap: spacing.md },
  resultado: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  resultadoTitulo: {
    fontFamily: fontFamily.semibold,
    fontSize: 20,
    color: colors.primaryDark,
    marginTop: spacing.md,
  },
  resultadoTexto: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
});
