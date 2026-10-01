import { useRef } from 'react';
import { StyleSheet, Text } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tocavel } from './Tocavel';
import { colors, fontFamily, radius } from '@/src/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const LARGURA_ACAO = 96;

interface ItemDeslizavelProps {
  rotulo: string;
  icone: IconName;
  cor?: string;
  /** Chamado ao tocar na ação revelada. Fecha sozinho depois. */
  onAcao: () => void;
  desativado?: boolean;
  children: React.ReactNode;
}

function Acao({
  translacao,
  rotulo,
  icone,
  cor,
  onPress,
}: {
  translacao: SharedValue<number>;
  rotulo: string;
  icone: IconName;
  cor: string;
  onPress: () => void;
}) {
  const estilo = useAnimatedStyle(() => {
    const p = interpolate(-translacao.value, [0, LARGURA_ACAO], [0, 1], Extrapolation.CLAMP);
    return { opacity: p, transform: [{ scale: 0.7 + p * 0.3 }] };
  });

  return (
    <Tocavel
      onPress={onPress}
      style={[styles.acao, { backgroundColor: cor }]}
      corRipple="rgba(255,255,255,0.25)"
      escala={0.95}
      accessibilityRole="button"
      accessibilityLabel={rotulo}
    >
      <Animated.View style={[styles.acaoConteudo, estilo]}>
        <MaterialCommunityIcons name={icone} size={22} color={colors.white} />
        <Text style={styles.acaoTexto}>{rotulo}</Text>
      </Animated.View>
    </Tocavel>
  );
}

/** Deslizar para a esquerda revela uma ação (Swipe to Action) */
export function ItemDeslizavel({
  rotulo,
  icone,
  cor = colors.error,
  onAcao,
  desativado = false,
  children,
}: ItemDeslizavelProps) {
  const ref = useRef<SwipeableMethods>(null);

  if (desativado) return <>{children}</>;

  return (
    <ReanimatedSwipeable
      ref={ref}
      friction={2}
      rightThreshold={LARGURA_ACAO / 2}
      overshootRight={false}
      containerStyle={styles.container}
      renderRightActions={(_progresso, translacao) => (
        <Acao
          translacao={translacao}
          rotulo={rotulo}
          icone={icone}
          cor={cor}
          onPress={() => {
            ref.current?.close();
            onAcao();
          }}
        />
      )}
    >
      {children}
    </ReanimatedSwipeable>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: radius.lg },
  acao: {
    width: LARGURA_ACAO,
    marginLeft: 8,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acaoConteudo: { alignItems: 'center', gap: 4 },
  acaoTexto: { fontFamily: fontFamily.semibold, fontSize: 12, color: colors.white },
});
