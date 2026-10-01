import { useState } from 'react';
import {
  Pressable,
  type GestureResponderEvent,
  type LayoutChangeEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TocavelProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Escala ao tocar (Scale on Press). 1 desliga. */
  escala?: number;
  /** Efeito Ripple (ondulação) a partir do ponto de toque */
  ripple?: boolean;
  corRipple?: string;
}

/** Pressable com escala ao tocar e ondulação, iguais em Android e iOS */
export function Tocavel({
  children,
  style,
  escala = 0.97,
  ripple = true,
  corRipple = 'rgba(37, 99, 235, 0.14)',
  onPressIn,
  onPressOut,
  onLayout,
  disabled,
  ...rest
}: TocavelProps) {
  const [tamanho, setTamanho] = useState({ w: 0, h: 0 });
  const s = useSharedValue(1);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const progresso = useSharedValue(0);
  const opacidade = useSharedValue(0);

  const raio = Math.sqrt(tamanho.w ** 2 + tamanho.h ** 2);

  const estiloEscala = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  const estiloRipple = useAnimatedStyle(() => ({
    left: x.value - raio,
    top: y.value - raio,
    opacity: opacidade.value,
    transform: [{ scale: progresso.value }],
  }));

  function aoPressionar(e: GestureResponderEvent) {
    s.set(withSpring(escala, { damping: 18, stiffness: 400 }));
    if (ripple) {
      x.set(e.nativeEvent.locationX);
      y.set(e.nativeEvent.locationY);
      progresso.set(0);
      opacidade.set(1);
      progresso.set(withTiming(1, { duration: 450, easing: Easing.out(Easing.quad) }));
    }
    onPressIn?.(e);
  }

  function aoLargar(e: GestureResponderEvent) {
    s.set(withSpring(1, { damping: 14, stiffness: 300 }));
    opacidade.set(withTiming(0, { duration: 400 }));
    onPressOut?.(e);
  }

  function aoMedir(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (width !== tamanho.w || height !== tamanho.h) setTamanho({ w: width, h: height });
    onLayout?.(e);
  }

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={aoPressionar}
      onPressOut={aoLargar}
      onLayout={aoMedir}
      style={[style, { overflow: 'hidden' }, estiloEscala]}
    >
      {(estado) => (
        <>
          {typeof children === 'function' ? children(estado) : children}
          {ripple && raio > 0 ? (
            <Animated.View
              pointerEvents="none"
              style={[
                {
                  position: 'absolute',
                  width: raio * 2,
                  height: raio * 2,
                  borderRadius: raio,
                  backgroundColor: corRipple,
                },
                estiloRipple,
              ]}
            />
          ) : null}
        </>
      )}
    </AnimatedPressable>
  );
}
