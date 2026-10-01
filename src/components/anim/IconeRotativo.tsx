import { useEffect } from 'react';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/src/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Rotação contínua (indicador de sincronização) enquanto `ativo` */
export function IconeRotativo({
  nome = 'sync',
  tamanho = 20,
  cor = colors.primary,
  ativo = true,
  duracao = 1100,
}: {
  nome?: IconName;
  tamanho?: number;
  cor?: string;
  ativo?: boolean;
  duracao?: number;
}) {
  const rotacao = useSharedValue(0);

  useEffect(() => {
    if (ativo) {
      rotacao.value = 0;
      rotacao.value = withRepeat(withTiming(360, { duration: duracao, easing: Easing.linear }), -1);
    } else {
      cancelAnimation(rotacao);
      rotacao.value = withTiming(0, { duration: 200 });
    }
  }, [ativo, duracao, rotacao]);

  const estilo = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotacao.value}deg` }] }));

  return (
    <Animated.View style={estilo}>
      <MaterialCommunityIcons name={nome} size={tamanho} color={cor} />
    </Animated.View>
  );
}
