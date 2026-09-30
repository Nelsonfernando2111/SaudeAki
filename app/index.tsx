import { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Logo } from '@/src/components/shared/Logo';
import { colors, fontFamily } from '@/src/theme';
import { obterSessao } from '@/src/utils/sessao';

const DURACAO_MINIMA_MS = 2200;

export default function Splash() {
  const router = useRouter();
  const opacidade = useRef(new Animated.Value(0)).current;
  const escala = useRef(new Animated.Value(0.8)).current;
  const opacidadeRodape = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacidade, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(escala, {
        toValue: 1,
        friction: 6,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.timing(opacidadeRodape, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    });
  }, [opacidade, escala, opacidadeRodape]);

  useEffect(() => {
    let cancelado = false;

    async function decidirDestino() {
      const [sessao] = await Promise.all([
        obterSessao(),
        new Promise((resolve) => setTimeout(resolve, DURACAO_MINIMA_MS)),
      ]);
      if (cancelado) return;

      if (sessao?.perfil === 'paciente') {
        router.replace('/(paciente)/(tabs)' as any);
      } else if (sessao?.perfil === 'medico') {
        router.replace('/(medico)/(tabs)' as any);
      } else {
        router.replace('/(auth)/escolher-perfil' as any);
      }
    }

    decidirDestino();
    return () => {
      cancelado = true;
    };
  }, [router]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: opacidade, transform: [{ scale: escala }] }}>
        <Logo tamanho={110} mostrarSlogan variante="claro" />
      </Animated.View>

      <Animated.View style={[styles.rodape, { opacity: opacidadeRodape }]}>
        <ActivityIndicator color={colors.white} />
        <Text style={styles.versao}>v1.0.0</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rodape: {
    position: 'absolute',
    bottom: 56,
    alignItems: 'center',
    gap: 12,
  },
  versao: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
});