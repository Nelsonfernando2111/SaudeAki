import { useEffect } from 'react';
import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Extrapolation,
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Skeleton } from '@/src/components/anim/Skeleton';
import { Tocavel } from '@/src/components/anim/Tocavel';
import { LogoMini } from '@/src/components/shared/LogoMini';
import { Etiqueta } from '@/src/components/ui/Etiqueta';
import { useRecurso } from '@/src/hooks/useRecurso';
import { obterMeuHistorico } from '@/src/services/paciente.service';
import { listarPedidos } from '@/src/services/pedido.service';
import { useSessaoStore } from '@/src/store/sessao.store';
import { toast } from '@/src/store/toast.store';
import { plural, tipoSanguineo } from '@/src/utils/clinico';
import { formatarHora } from '@/src/utils/datas';
import { estadoEfetivo } from '@/src/utils/pedidos';
import type { HistoricoClinico, PedidoAcesso } from '@/src/types';
import { colors, fontFamily, radius, sombra, spacing } from '@/src/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const ALTURA_HEROI = 170;

interface CartaoResumoProps {
  icone: IconName;
  cor: string;
  fundo: string;
  titulo: string;
  detalhe: string;
  indice: number;
  onPress: () => void;
}

function CartaoResumo({ icone, cor, fundo, titulo, detalhe, indice, onPress }: CartaoResumoProps) {
  return (
    <Animated.View entering={FadeInDown.delay(80 + indice * 60).duration(350)} style={styles.cartaoResumoCaixa}>
      <Tocavel onPress={onPress} style={styles.cartaoResumo} accessibilityRole="button">
        <View style={[styles.cartaoIcone, { backgroundColor: fundo }]}>
          <MaterialCommunityIcons name={icone} size={22} color={cor} />
        </View>
        <Text style={styles.cartaoTitulo}>{titulo}</Text>
        <Text style={styles.cartaoDetalhe}>{detalhe}</Text>
      </Tocavel>
    </Animated.View>
  );
}

export default function HomePaciente() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const paciente = useSessaoStore((s) => s.paciente);
  const definirPaciente = useSessaoStore((s) => s.definirPaciente);

  const historico = useRecurso<HistoricoClinico>(obterMeuHistorico, [], { aoFocar: true });
  const pendentes = useRecurso(
    () => listarPedidos({ estado: 'PENDENTE', size: 5 }).then((p) => p.content),
    [],
    { aoFocar: true }
  );

  // O histórico traz o perfil atualizado
  useEffect(() => {
    if (historico.dados?.paciente) definirPaciente(historico.dados.paciente);
  }, [historico.dados, definirPaciente]);

  /* ---------- Parallax do cabeçalho ---------- */
  const scrollY = useSharedValue(0);
  const aoRolar = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const estiloHeroi = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [-100, 0, ALTURA_HEROI], [-50, 0, ALTURA_HEROI * 0.5], Extrapolation.CLAMP) },
      { scale: interpolate(scrollY.value, [-100, 0], [1.08, 1], Extrapolation.CLAMP) },
    ],
    opacity: interpolate(scrollY.value, [0, ALTURA_HEROI * 0.8], [1, 0.2], Extrapolation.CLAMP),
  }));

  async function copiarCodigo() {
    if (!paciente) return;
    await Clipboard.setStringAsync(paciente.codUnico);
    toast.sucesso('Código copiado');
  }

  function abrirPedido(p: PedidoAcesso) {
    router.push({
      pathname: '/(paciente)/pedido-acesso',
      params: {
        id: String(p.id),
        medicoNome: p.medicoNome,
        unidadeSanitariaNome: p.unidadeSanitariaNome ?? '',
        dataExpiracao: p.dataExpiracao,
      },
    } as any);
  }

  function atualizar() {
    historico.atualizar();
    pendentes.recarregar();
  }

  const h = historico.dados;
  const alergias = h?.condicoes.filter((c) => c.tipo === 'ALERGIA') ?? [];
  const cronicas = h?.condicoes.filter((c) => c.tipo === 'DOENCA_CRONICA') ?? [];
  const ativas = h?.prescricoes.filter((p) => p.ativa) ?? [];
  const pedidosAbertos = (pendentes.dados ?? []).filter((p) => estadoEfetivo(p) === 'PENDENTE');
  const primeiroNome = paciente?.nomeCompleto.split(' ')[0] ?? '';
  const irHistorico = () => router.push('/(paciente)/(tabs)/historico' as any);

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        onScroll={aoRolar}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.md }]}
        refreshControl={
          <RefreshControl
            refreshing={historico.aAtualizar}
            onRefresh={atualizar}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.topo}>
          <LogoMini />
        </View>

        {/* Herói azul com parallax */}
        <Animated.View style={[styles.heroi, estiloHeroi]}>
          <MaterialCommunityIcons name="heart-pulse" size={120} color="rgba(255,255,255,0.12)" style={styles.heroiMarca} />
          {paciente ? (
            <>
              <Text style={styles.saudacao}>Olá, {primeiroNome} 👋</Text>
              <Text style={styles.subSaudacao}>Aqui está um resumo da sua saúde</Text>
            </>
          ) : (
            <>
              <Skeleton largura="55%" altura={24} style={{ backgroundColor: 'rgba(255,255,255,0.3)' }} />
              <Skeleton largura="70%" altura={14} style={{ marginTop: 10, backgroundColor: 'rgba(255,255,255,0.3)' }} />
            </>
          )}
        </Animated.View>

        {/* Código único */}
        <View style={styles.cartaoCodigo}>
          <View style={{ flex: 1 }}>
            <Text style={styles.codigoLabel}>Código único</Text>
            {paciente ? (
              <Text style={styles.codigoValor}>{paciente.codUnico}</Text>
            ) : (
              <Skeleton largura={140} altura={24} style={{ marginTop: 4 }} />
            )}
            <Text style={styles.codigoAjuda}>
              Tipo sanguíneo: {tipoSanguineo(paciente?.grupoSanguineo, paciente?.fatorRh)}
            </Text>
          </View>
          <Tocavel
            onPress={copiarCodigo}
            style={styles.botaoCopiar}
            escala={0.9}
            accessibilityLabel="Copiar código"
          >
            <MaterialCommunityIcons name="content-copy" size={20} color={colors.primary} />
          </Tocavel>
        </View>

        {/* Pedidos de acesso pendentes */}
        {pedidosAbertos.length > 0 ? (
          <Animated.View entering={FadeInDown} style={styles.pendentes}>
            <Text style={styles.secaoTitulo}>Pedidos de acesso</Text>
            {pedidosAbertos.map((p) => (
              <Tocavel key={p.id} onPress={() => abrirPedido(p)} style={styles.pedido}>
                <View style={styles.pedidoIcone}>
                  <MaterialCommunityIcons name="bell-ring-outline" size={22} color={colors.warningText} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pedidoNome}>{p.medicoNome}</Text>
                  <Text style={styles.pedidoMeta}>
                    {p.unidadeSanitariaNome ?? 'Unidade não indicada'} · {formatarHora(p.dataPedido)}
                  </Text>
                </View>
                <Etiqueta texto="Responder" cor={colors.warningText} fundo={colors.warningSoft} />
              </Tocavel>
            ))}
          </Animated.View>
        ) : null}

        {/* Grelha de resumo */}
        <Text style={[styles.secaoTitulo, styles.secaoMargem]}>O seu resumo</Text>
        {historico.carregando ? (
          <View style={styles.grelha}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.cartaoResumoCaixa, styles.cartaoResumo]}>
                <Skeleton largura={40} altura={40} raio={12} />
                <Skeleton largura="70%" altura={14} style={{ marginTop: spacing.md }} />
                <Skeleton largura="50%" altura={12} style={{ marginTop: 6 }} />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.grelha}>
            <CartaoResumo
              indice={0}
              icone="flower-pollen-outline"
              cor={colors.error}
              fundo={colors.errorSoft}
              titulo="Alergias"
              detalhe={plural(alergias.length, 'registada', 'registadas')}
              onPress={irHistorico}
            />
            <CartaoResumo
              indice={1}
              icone="heart-pulse"
              cor={colors.success}
              fundo={colors.successSoft}
              titulo="Condições crónicas"
              detalhe={plural(cronicas.length, 'registada', 'registadas')}
              onPress={irHistorico}
            />
            <CartaoResumo
              indice={2}
              icone="pill"
              cor={colors.purple}
              fundo={colors.purpleSoft}
              titulo="Medicação ativa"
              detalhe={plural(ativas.length, 'medicamento', 'medicamentos')}
              onPress={irHistorico}
            />
            <CartaoResumo
              indice={3}
              icone="flask-outline"
              cor={colors.primary}
              fundo={colors.primarySoft}
              titulo="Exames"
              detalhe={plural(h?.exames.length ?? 0, 'registado', 'registados')}
              onPress={irHistorico}
            />
          </View>
        )}

        {historico.erro && !h ? (
          <Text style={styles.erro}>{historico.erro.message} Puxe para atualizar.</Text>
        ) : null}

        {/* Banner */}
        <Tocavel
          style={styles.banner}
          onPress={() => router.push('/(paciente)/dados-pessoais' as any)}
        >
          <MaterialCommunityIcons name="account-edit-outline" size={24} color={colors.primary} />
          <Text style={styles.bannerTexto}>
            Mantenha os seus dados atualizados para um melhor atendimento.
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.primary} />
        </Tocavel>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xxl },
  topo: { paddingHorizontal: spacing.xl, marginBottom: spacing.lg },
  heroi: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.xl,
    borderRadius: radius.xl,
    padding: spacing.xl,
    paddingBottom: 56,
    minHeight: ALTURA_HEROI - 40,
    overflow: 'hidden',
  },
  heroiMarca: { position: 'absolute', right: -16, bottom: -24 },
  saudacao: { fontFamily: fontFamily.semibold, fontSize: 24, color: colors.white },
  subSaudacao: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  cartaoCodigo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xl + spacing.md,
    marginTop: -36,
    padding: spacing.lg,
    borderRadius: radius.lg,
    ...sombra,
    shadowOpacity: 0.12,
  },
  codigoLabel: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.textSecondary },
  codigoValor: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    color: colors.primaryDark,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  codigoAjuda: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  botaoCopiar: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secaoTitulo: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    color: colors.text,
    paddingHorizontal: spacing.xl,
  },
  secaoMargem: { marginTop: spacing.xl, marginBottom: spacing.md },
  pendentes: { marginTop: spacing.xl, gap: spacing.md },
  pedido: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.warning,
    padding: spacing.lg,
  },
  pedidoIcone: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pedidoNome: { fontFamily: fontFamily.semibold, fontSize: 15, color: colors.text },
  pedidoMeta: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  grelha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  cartaoResumoCaixa: { width: '47%', flexGrow: 1 },
  cartaoResumo: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cartaoIcone: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  cartaoTitulo: { fontFamily: fontFamily.semibold, fontSize: 14, color: colors.text },
  cartaoDetalhe: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  erro: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primaryFaint,
    borderWidth: 1,
    borderColor: colors.primarySoft,
    marginHorizontal: spacing.xl,
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  bannerTexto: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.primaryDark,
    lineHeight: 20,
  },
});
