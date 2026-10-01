import { useCallback } from 'react';
import { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

/** Tremor de erro (shake): aplicar `estilo` a um Animated.View e chamar `tremer()` */
export function useTremor() {
  const x = useSharedValue(0);

  const tremer = useCallback(() => {
    const t = (v: number) => withTiming(v, { duration: 55 });
    x.value = withSequence(t(-10), t(10), t(-8), t(8), t(-4), t(4), t(0));
  }, [x]);

  const estilo = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return { estilo, tremer };
}
