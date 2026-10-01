import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { Logo } from '@/src/components/shared/Logo';
import { colors, fontFamily } from '@/src/theme';
import { obterSessao } from '@/src/utils/sessao';

const DURACAO_MINIMA_MS = 1800;

export default function Splash() {
  const router = useRouter();

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
      <Animated.View entering={ZoomIn.springify().damping(12)}>
        <Logo tamanho={110} mostrarSlogan variante="escuro" />
      </Animated.View>

      <Animated.View entering={FadeIn.delay(600).duration(500)} style={styles.rodape}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.versao}>v1.0.0</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
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
    color: colors.textSecondary,
  },
});
