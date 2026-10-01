import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tocavel } from './Tocavel';
import { colors, fontFamily, spacing } from '@/src/theme';

interface ExpansivelProps {
  titulo: string;
  subtitulo?: string;
  inicialAberto?: boolean;
  direita?: React.ReactNode;
  children: React.ReactNode;
}

/** Secção que expande e retrai com animação de altura (Collapse / Expand) */
export function Expansivel({
  titulo,
  subtitulo,
  inicialAberto = false,
  direita,
  children,
}: ExpansivelProps) {
  const [aberto, setAberto] = useState(inicialAberto);
  const altura = useSharedValue(0);
  const progresso = useSharedValue(inicialAberto ? 1 : 0);

  useEffect(() => {
    progresso.set(withTiming(aberto ? 1 : 0, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    }));
  }, [aberto, progresso]);

  const estiloCorpo = useAnimatedStyle(() => ({
    height: altura.value * progresso.value,
    opacity: progresso.value,
  }));
  const estiloSeta = useAnimatedStyle(() => ({
    transform: [{ rotate: `${progresso.value * 180}deg` }],
  }));

  return (
    <View>
      <Tocavel
        onPress={() => setAberto((a) => !a)}
        style={styles.cabecalho}
        escala={0.99}
        accessibilityRole="button"
        accessibilityState={{ expanded: aberto }}
      >
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>{titulo}</Text>
          {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
        </View>
        {direita}
        <Animated.View style={estiloSeta}>
          <MaterialCommunityIcons name="chevron-down" size={22} color={colors.textSecondary} />
        </Animated.View>
      </Tocavel>

      <Animated.View style={[styles.corpo, estiloCorpo]}>
        <View
          style={styles.medida}
          onLayout={(e) => {
            altura.set(e.nativeEvent.layout.height);
          }}
        >
          {children}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  titulo: { fontFamily: fontFamily.semibold, fontSize: 15, color: colors.text },
  subtitulo: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  corpo: { overflow: 'hidden' },
  medida: { position: 'absolute', left: 0, right: 0, top: 0 },
});
