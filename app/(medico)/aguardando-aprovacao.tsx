import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { IconeRotativo } from '@/src/components/anim/IconeRotativo';
import { PulsoSucesso } from '@/src/components/anim/PulsoSucesso';
import { Avatar } from '@/src/components/ui/Avatar';
import { Button } from '@/src/components/ui/Button';
import { useContagem } from '@/src/hooks/useContagem';
import { useTopico } from '@/src/hooks/useTopico';
import { obterEstadoPedido } from '@/src/services/pedido.service';
import { topicos } from '@/src/services/realtime';
import { useSessaoStore } from '@/src/store/sessao.store';
import { formatarContagem } from '@/src/utils/datas';
import type { EstadoPedido, PedidoAcessoResumo } from '@/src/types';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

const INTERVALO_MS = 3000;

/** Ondas a expandir à volta do relógio enquanto se espera */
function Onda({ atraso }: { atraso: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    const t = setTimeout(() => {
      p.set(withRepeat(withTiming(1, { duration: 2000, easing: Easing.out(Easing.quad) }), -1));
    }, atraso);
    return () => clearTimeout(t);
  }, [atraso, p]);
  const estilo = useAnimatedStyle(() => ({ opacity: 0.5 * (1 - p.value), transform: [{ scale: 1 + p.value * 0.9 }] }));
  return <Animated.View style={[styles.onda, estilo]} />;
}

export default function AguardandoAprovacao() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const medico = useSessaoStore((s) => s.medico);
  const { id, pacienteId, pacienteNome, dataExpiracao } = useLocalSearchParams<{
    id: string;
    pacienteId: string;
    pacienteNome: string;
    dataExpiracao: string;
  }>();

  const [estado, setEstado] = useState<EstadoPedido>('PENDENTE');
  const segundos = useContagem(dataExpiracao);
  const terminado = useRef(false);

  const aplicar = useCallback(
    (novo: EstadoPedido) => {
      if (terminado.current || novo === 'PENDENTE') return;
      terminado.current = true;
      setEstado(novo);
      if (novo === 'APROVADO') {
        setTimeout(() => router.replace(`/(medico)/historico/${pacienteId}` as any), 1300);
      }
    },
    [router, pacienteId]
  );

  // Tempo real: /topic/medico/{medicoId}/pedidos
  useTopico<PedidoAcessoResumo>(medico ? topicos.pedidosDoMedico(medico.id) : null, (m) => {
    if (String(m?.id) === id) aplicar(m.estado);
  });

  // Fallback: GET /pedidos-acesso/{id}/estado
  useEffect(() => {
    if (!id) return;
    let ativo = true;
    let timer: ReturnType<typeof setTimeout>;
    async function verificar() {
      try {
        const e = await obterEstadoPedido(id);
        if (!ativo) return;
        aplicar(e);
      } catch {
        // tenta de novo no próximo ciclo
      }
      if (ativo && !terminado.current) timer = setTimeout(verificar, INTERVALO_MS);
    }
    verificar();
    return () => {
      ativo = false;
      clearTimeout(timer);
    };
  }, [id, aplicar]);

  // O servidor marca EXPIRADO; localmente assume-se ao chegar a 0
  useEffect(() => {
    if (dataExpiracao && segundos === 0 && Date.now() >= new Date(dataExpiracao).getTime() + 1500) {
      aplicar('EXPIRADO');
    }
  }, [segundos, dataExpiracao, aplicar]);

  const voltarFicha = () => router.replace(`/(medico)/paciente/${pacienteId}` as any);

  /* ---------- Resposta ---------- */
  if (estado !== 'PENDENTE') {
    const cfg = {
      APROVADO: { icone: 'check', cor: colors.success, fundo: colors.successSoft, titulo: 'Acesso aprovado', texto: 'A abrir o histórico clínico completo…' },
      RECUSADO: { icone: 'close', cor: colors.error, fundo: colors.errorSoft, titulo: 'Acesso recusado', texto: 'O paciente não autorizou o acesso ao histórico completo.' },
      EXPIRADO: { icone: 'clock-alert-outline', cor: colors.warningText, fundo: colors.warningSoft, titulo: 'Pedido expirado', texto: 'O paciente não respondeu em 60 segundos. Pode enviar um novo pedido.' },
    }[estado] as { icone: any; cor: string; fundo: string; titulo: string; texto: string };

    return (
      <View style={[styles.container, styles.centro, { padding: spacing.xl }]}>
        <PulsoSucesso icone={cfg.icone} cor={cfg.cor} fundo={cfg.fundo} />
        <Animated.Text entering={FadeInDown.delay(150)} style={styles.titulo}>
          {cfg.titulo}
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(220)} style={styles.texto}>
          {cfg.texto}
        </Animated.Text>
        {estado !== 'APROVADO' ? (
          <Animated.View entering={FadeIn.delay(300)} style={styles.acoes}>
            <Button titulo="Voltar à ficha do paciente" onPress={voltarFicha} />
          </Animated.View>
        ) : null}
      </View>
    );
  }

  /* ---------- A aguardar ---------- */
  const urgente = segundos <= 10;

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.conteudo}>
        <View style={styles.relogio}>
          <Onda atraso={0} />
          <Onda atraso={1000} />
          <View style={styles.relogioCentro}>
            <MaterialCommunityIcons name="clock-outline" size={46} color={colors.primary} />
          </View>
        </View>

        <Text style={styles.titulo}>Aguardando aprovação</Text>
        <Text style={styles.texto}>
          O pedido foi enviado ao telemóvel do paciente. Esta página atualiza sozinha quando houver resposta.
        </Text>

        <View style={styles.cartao}>
          <Avatar nome={pacienteNome} tagTransicao={`paciente-${pacienteId}`} />
          <View style={{ flex: 1 }}>
            <Text style={styles.cartaoLabel}>Paciente</Text>
            <Text style={styles.cartaoValor}>{pacienteNome}</Text>
          </View>
          <IconeRotativo tamanho={20} />
        </View>

        <View style={[styles.tempo, urgente && styles.tempoUrgente]}>
          <Text style={[styles.tempoLabel, urgente && { color: colors.error }]}>Tempo limite</Text>
          <View style={styles.tempoLinha}>
            <MaterialCommunityIcons name="timer-outline" size={22} color={urgente ? colors.error : colors.primary} />
            <Text style={[styles.tempoValor, urgente && { color: colors.error }]}>{formatarContagem(segundos)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.acoes}>
        <Button titulo="Voltar" variante="secundario" onPress={voltarFicha} />
        <Text style={styles.nota}>O pedido expira sozinho se o paciente não responder.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: spacing.xl },
  centro: { alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  conteudo: { flex: 1, alignItems: 'center', gap: spacing.md },
  relogio: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  onda: {
    position: 'absolute',
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: colors.primarySoft,
  },
  relogioCentro: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryFaint,
    borderWidth: 2,
    borderColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontFamily: fontFamily.semibold, fontSize: 20, color: colors.primaryDark, textAlign: 'center', marginTop: spacing.sm },
  texto: { fontFamily: fontFamily.regular, fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  cartao: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  cartaoLabel: { fontFamily: fontFamily.regular, fontSize: 11, color: colors.textSecondary },
  cartaoValor: { fontFamily: fontFamily.semibold, fontSize: 15, color: colors.text },
  tempo: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: colors.primaryFaint,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
  },
  tempoUrgente: { backgroundColor: colors.errorSoft },
  tempoLabel: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.primary },
  tempoLinha: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  tempoValor: { fontFamily: fontFamily.bold, fontSize: 24, color: colors.primary },
  acoes: { alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.xl },
  nota: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
});
