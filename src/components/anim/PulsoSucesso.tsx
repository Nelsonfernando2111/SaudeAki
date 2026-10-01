import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@/src/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface PulsoSucessoProps {
  icone?: IconName;
  cor?: string;
  fundo?: string;
  tamanho?: number;
}

/** Ícone que "salta" (snap) com um anel a expandir — confirmação de sucesso */
export function PulsoSucesso({
  icone = 'check',
  cor = colors.success,
  fundo = colors.successSoft,
  tamanho = 88,
}: PulsoSucessoProps) {
  const escala = useSharedValue(0);
  const anel = useSharedValue(0);

  useEffect(() => {
    escala.value = withSequence(
      withSpring(1.18, { damping: 6, stiffness: 260 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );
    anel.value = withDelay(120, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [escala, anel]);

  const estiloIcone = useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));
  const estiloAnel = useAnimatedStyle(() => ({
    opacity: 1 - anel.value,
    transform: [{ scale: 1 + anel.value * 0.7 }],
  }));

  return (
    <View style={{ width: tamanho, height: tamanho, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: tamanho,
            height: tamanho,
            borderRadius: tamanho / 2,
            borderWidth: 3,
            borderColor: cor,
          },
          estiloAnel,
        ]}
      />
      <Animated.View
        style={[
          {
            width: tamanho,
            height: tamanho,
            borderRadius: tamanho / 2,
            backgroundColor: fundo,
            alignItems: 'center',
            justifyContent: 'center',
          },
          estiloIcone,
        ]}
      >
        <MaterialCommunityIcons name={icone} size={tamanho * 0.48} color={cor} />
      </Animated.View>
    </View>
  );
}
