import { useEffect } from 'react';
import { StyleSheet, View, type DimensionValue, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { colors, radius, spacing } from '@/src/theme';

interface SkeletonProps {
  largura?: DimensionValue;
  altura?: number;
  raio?: number;
  style?: StyleProp<ViewStyle>;
}

/** Bloco cinzento a pulsar enquanto os dados carregam (Skeleton Loading) */
export function Skeleton({ largura = '100%', altura = 14, raio = 6, style }: SkeletonProps) {
  const opacidade = useSharedValue(0.45);

  useEffect(() => {
    opacidade.set(withRepeat(
      withTiming(1, { duration: 750, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    ));
  }, [opacidade]);

  const estilo = useAnimatedStyle(() => ({ opacity: opacidade.value }));

  return (
    <Animated.View
      style={[
        { width: largura, height: altura, borderRadius: raio, backgroundColor: colors.skeleton },
        estilo,
        style,
      ]}
    />
  );
}

/** Cartão genérico: avatar + duas linhas */
export function SkeletonCartao() {
  return (
    <View style={styles.cartao}>
      <Skeleton largura={44} altura={44} raio={22} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton largura="70%" altura={14} />
        <Skeleton largura="45%" altura={12} />
      </View>
    </View>
  );
}

export function SkeletonLista({ itens = 4 }: { itens?: number }) {
  return (
    <View style={{ gap: spacing.md }}>
      {Array.from({ length: itens }, (_, i) => (
        <SkeletonCartao key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
});
