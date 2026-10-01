import { RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
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

import { SkeletonLista } from '@/src/components/anim/Skeleton';
import { Tocavel } from '@/src/components/anim/Tocavel';
import { CartaoPedido } from '@/src/components/shared/CartaoPedido';
import { LogoMini } from '@/src/components/shared/LogoMini';
import { Avatar } from '@/src/components/ui/Avatar';
import { useRecurso } from '@/src/hooks/useRecurso';
import { listarPedidos } from '@/src/services/pedido.service';
import { useSessaoStore } from '@/src/store/sessao.store';
import { estadoEfetivo, pacientesRecentes, sessaoProvavelmenteAtiva } from '@/src/utils/pedidos';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const ALTURA_HEROI = 150;

function Atalho({
  icone,
  cor,
  fundo,
  titulo,
  contador,
  onPress,
}: {
  icone: IconName;
  cor: string;
  fundo: string;
  titulo: string;
  contador?: number;
  onPress: () => void;
}) {
  return (
    <Tocavel onPress={onPress} style={[styles.atalho, { backgroundColor: fundo }]}>
      <View style={styles.atalhoIconeLinha}>
        <MaterialCommunityIcons name={icone} size={26} color={cor} />
        {contador ? (
          <View style={styles.contador}>
            <Text style={styles.contadorTexto}>{contador}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.atalhoTitulo, { color: cor }]}>{titulo}</Text>
    </Tocavel>
  );
}

function CabecalhoSecao({ titulo, onVerTodos }: { titulo: string; onVerTodos?: () => void }) {
  return (
    <View style={styles.secaoCabecalho}>
      <Text style={styles.secaoTitulo}>{titulo}</Text>
      {onVerTodos ? (
        <Tocavel onPress={onVerTodos} style={styles.verTodos} escala={0.95}>
          <Text style={styles.verTodosTexto}>Ver todos</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color={colors.primary} />
        </Tocavel>
      ) : null}
    </View>
  );
}

export default function InicioMedico() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const medico = useSessaoStore((s) => s.medico);

  const pedidos = useRecurso(() => listarPedidos({ size: 30 }).then((p) => p.content), [], {
    aoFocar: true,
  });

  const scrollY = useSharedValue(0);
  const aoRolar = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const estiloHeroi = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [-100, 0, ALTURA_HEROI], [-50, 0, ALTURA_HEROI * 0.5], Extrapolation.CLAMP) },
      { scale: interpolate(scrollY.value, [-100, 0], [1.08, 1], Extrapolation.CLAMP) },
    ],
    opacity: interpolate(scrollY.value, [0, ALTURA_HEROI], [1, 0.2], Extrapolation.CLAMP),
  }));

  const lista = pedidos.dados ?? [];
  const pendentes = lista.filter((p) => estadoEfetivo(p) === 'PENDENTE');
  const comAcesso = pacientesRecentes(lista.filter(sessaoProvavelmenteAtiva));
  const recentes = pacientesRecentes(lista).slice(0, 3);
  const irPara = (rota: string) => router.push(rota as any);

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        onScroll={aoRolar}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + spacing.md }]}
        refreshControl={
          <RefreshControl
            refreshing={pedidos.aAtualizar}
            onRefresh={pedidos.atualizar}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.topo}>
          <LogoMini />
          <Tocavel
            onPress={() => irPara('/(medico)/(tabs)/pedidos')}
            style={styles.sino}
            escala={0.9}
            accessibilityLabel="Pedidos"
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color={colors.primary} />
            {pendentes.length > 0 ? (
              <View style={styles.sinoContador}>
                <Text style={styles.contadorTexto}>{pendentes.length}</Text>
              </View>
            ) : null}
          </Tocavel>
        </View>

        <Animated.View style={[styles.heroi, estiloHeroi]}>
          <MaterialCommunityIcons name="stethoscope" size={120} color="rgba(255,255,255,0.12)" style={styles.heroiMarca} />
          <View style={styles.medico}>
            <Avatar nome={medico?.nomeCompleto} tamanho={56} cor={colors.primary} fundo={colors.white} />
            <View style={{ flex: 1 }}>
              <Text style={styles.saudacao} numberOfLines={1}>
                Olá, {medico?.nomeCompleto ?? '…'}
              </Text>
              <Text style={styles.medicoMeta}>
                {medico?.especialidade ?? 'Médico'}
                {medico?.numeroOrdem ? ` · ${medico.numeroOrdem}` : ''}
              </Text>
              <Text style={styles.medicoMeta}>{medico?.unidadeSanitariaNome ?? 'Sem unidade associada'}</Text>
            </View>
          </View>
        </Animated.View>

        <View style={styles.folha}>
          <Tocavel onPress={() => irPara('/(medico)/(tabs)/pacientes')} style={styles.pesquisa}>
            <View style={styles.pesquisaIcone}>
              <MaterialCommunityIcons name="magnify" size={26} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pesquisaTitulo}>Pesquisar paciente</Text>
              <Text style={styles.pesquisaTexto}>Introduza o código único (PAC-XXXX) para ver a ficha.</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.primary} />
          </Tocavel>

          <View style={styles.atalhos}>
            <Atalho
              icone="account-search-outline"
              cor={colors.primary}
              fundo={colors.primarySoft}
              titulo="Pacientes"
              onPress={() => irPara('/(medico)/(tabs)/pacientes')}
            />
            <Atalho
              icone="clipboard-clock-outline"
              cor={colors.warningText}
              fundo={colors.warningSoft}
              titulo="Pedidos"
              contador={pendentes.length}
              onPress={() => irPara('/(medico)/(tabs)/pedidos')}
            />
            <Atalho
              icone="account-circle-outline"
              cor={colors.purple}
              fundo={colors.purpleSoft}
              titulo="Perfil"
              onPress={() => irPara('/(medico)/(tabs)/perfil')}
            />
          </View>

          {comAcesso.length > 0 ? (
            <>
              <CabecalhoSecao titulo="Com acesso completo agora" />
              <View style={styles.lista}>
                {comAcesso.map((p, i) => (
                  <Animated.View key={p.id} entering={FadeInDown.delay(i * 60)}>
                    <CartaoPedido pedido={p} />
                  </Animated.View>
                ))}
              </View>
            </>
          ) : null}

          {pendentes.length > 0 ? (
            <>
              <CabecalhoSecao titulo="A aguardar resposta" onVerTodos={() => irPara('/(medico)/(tabs)/pedidos')} />
              <View style={styles.lista}>
                {pendentes.slice(0, 2).map((p, i) => (
                  <Animated.View key={p.id} entering={FadeInDown.delay(i * 60)}>
                    <CartaoPedido pedido={p} />
                  </Animated.View>
                ))}
              </View>
            </>
          ) : null}

          <CabecalhoSecao titulo="Pacientes recentes" onVerTodos={() => irPara('/(medico)/(tabs)/pacientes')} />
          {pedidos.carregando ? (
            <SkeletonLista itens={2} />
          ) : recentes.length === 0 ? (
            <Text style={styles.vazio}>
              {pedidos.erro ? pedidos.erro.message : 'Ainda não pediu acesso a nenhum paciente.'}
            </Text>
          ) : (
            <View style={styles.lista}>
              {recentes.map((p, i) => (
                <Animated.View key={p.id} entering={FadeInDown.delay(i * 60)}>
                  <CartaoPedido pedido={p} />
                </Animated.View>
              ))}
            </View>
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xxl },
  topo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  sino: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  sinoContador: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contador: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
    marginTop: -8,
  },
  contadorTexto: { fontFamily: fontFamily.bold, fontSize: 10, color: colors.white },
  heroi: {
    backgroundColor: colors.primary,
    marginHorizontal: spacing.xl,
    borderRadius: radius.xl,
    padding: spacing.xl,
    minHeight: ALTURA_HEROI - 30,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  heroiMarca: { position: 'absolute', right: -20, bottom: -30 },
  medico: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  saudacao: { fontFamily: fontFamily.semibold, fontSize: 19, color: colors.white },
  medicoMeta: { fontFamily: fontFamily.regular, fontSize: 13, color: 'rgba(255,255,255,0.9)', marginTop: 1 },
  folha: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  pesquisa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primarySoft,
    padding: spacing.lg,
  },
  pesquisaIcone: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pesquisaTitulo: { fontFamily: fontFamily.semibold, fontSize: 16, color: colors.primaryDark },
  pesquisaTexto: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 17 },
  atalhos: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  atalho: { flex: 1, borderRadius: radius.lg, padding: spacing.md, minHeight: 88, justifyContent: 'space-between' },
  atalhoIconeLinha: { flexDirection: 'row', alignItems: 'flex-start' },
  atalhoTitulo: { fontFamily: fontFamily.semibold, fontSize: 13 },
  secaoCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  secaoTitulo: { fontFamily: fontFamily.semibold, fontSize: 16, color: colors.text },
  verTodos: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 8 },
  verTodosTexto: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.primary },
  lista: { gap: spacing.md },
  vazio: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
