import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, { SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useToastStore, type TipoToast } from '@/src/store/toast.store';
import { colors, fontFamily, radius, sombra, spacing } from '@/src/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const ESTILO: Record<TipoToast, { cor: string; fundo: string; icone: IconName }> = {
  sucesso: { cor: colors.success, fundo: colors.successSoft, icone: 'check-circle' },
  erro: { cor: colors.error, fundo: colors.errorSoft, icone: 'alert-circle' },
  info: { cor: colors.primary, fundo: colors.primarySoft, icone: 'information' },
};

const DURACAO_MS = 3200;

/** Banner que desliza do topo (Snackbar / Toast Slide). Montar uma vez no layout raiz. */
export function ToastHost() {
  const insets = useSafeAreaInsets();
  const atual = useToastStore((s) => s.atual);
  const esconder = useToastStore((s) => s.esconder);

  useEffect(() => {
    if (!atual) return;
    const t = setTimeout(() => esconder(atual.id), DURACAO_MS);
    return () => clearTimeout(t);
  }, [atual, esconder]);

  if (!atual) return null;
  const estilo = ESTILO[atual.tipo];

  return (
    <Animated.View
      key={atual.id}
      entering={SlideInUp.springify().damping(18)}
      exiting={SlideOutUp.duration(220)}
      style={[styles.container, { top: insets.top + spacing.sm }]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={() => esconder(atual.id)}
        style={[styles.toast, { borderLeftColor: estilo.cor }]}
        accessibilityRole="alert"
      >
        <MaterialCommunityIcons name={estilo.icone} size={22} color={estilo.cor} />
        <Text style={styles.texto}>{atual.mensagem}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', left: spacing.lg, right: spacing.lg, zIndex: 1000 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...sombra,
    shadowOpacity: 0.15,
    elevation: 8,
  },
  texto: { flex: 1, fontFamily: fontFamily.medium, fontSize: 14, color: colors.text, lineHeight: 19 },
});
