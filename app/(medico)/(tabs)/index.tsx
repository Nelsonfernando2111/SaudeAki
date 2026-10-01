import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  Extrapolation,
  FadeInDown,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Tocavel } from '@/src/components/anim/Tocavel';
import { CartaoPacienteRecente } from '@/src/components/shared/CartaoPacienteRecente';
import { Avatar } from '@/src/components/ui/Avatar';
import { useRecentesStore } from '@/src/store/recentes.store';
import { useSessaoStore } from '@/src/store/sessao.store';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const ALTURA_HEROI = 150;

function Atalho({
  icone,
  cor,
  fundo,
  titulo,
  onPress,
}: {
  icone: IconName;
  cor: string;
  fundo: string;
  titulo: string;
  onPress: () => void;
}) {
  return (
    <Tocavel onPress={onPress} style={[styles.atalho, { backgroundColor: fundo }]}>
      <MaterialCommunityIcons name={icone} size={26} color={cor} />
      <Text style={[styles.atalhoTitulo, { color: cor }]}>{titulo}</Text>
    </Tocavel>
  );
}

export default function InicioMedico() {
  const router = useRouter();
  const medico = useSessaoStore((s) => s.medico);
  const recentes = useRecentesStore((s) => s.pacientes);

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

  const irPara = (rota: string) => router.push(rota as any);

  return (
    <View style={styles.container}>
      <Animated.ScrollView
        onScroll={aoRolar}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
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
              <Text style={styles.pesquisaTexto}>
                Introduza o código único (PAC-XXXX) para abrir a ficha e o histórico.
              </Text>
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
              icone="account-circle-outline"
              cor={colors.purple}
              fundo={colors.purpleSoft}
              titulo="Perfil"
              onPress={() => irPara('/(medico)/(tabs)/perfil')}
            />
          </View>

          <Text style={styles.secaoTitulo}>Pacientes recentes</Text>
          {recentes.length === 0 ? (
            <Text style={styles.vazio}>Os pacientes que abrir aparecem aqui.</Text>
          ) : (
            <View style={styles.lista}>
              {recentes.slice(0, 5).map((p, i) => (
                <Animated.View key={p.codUnico} entering={FadeInDown.delay(i * 60)}>
                  <CartaoPacienteRecente paciente={p} />
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
  scroll: { paddingTop: spacing.lg, paddingBottom: spacing.xxl },
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
  atalho: { flex: 1, borderRadius: radius.lg, padding: spacing.md, minHeight: 80, justifyContent: 'space-between' },
  atalhoTitulo: { fontFamily: fontFamily.semibold, fontSize: 13 },
  secaoTitulo: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  lista: { gap: spacing.md },
  vazio: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
