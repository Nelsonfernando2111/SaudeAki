import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fontFamily, spacing } from '@/src/theme';

interface CabecalhoProps {
  titulo: string;
  /** true = router.back(); função = ação personalizada */
  voltar?: boolean | (() => void);
  direita?: React.ReactNode;
}

/** Cabeçalho branco com título e ícones azuis */
export function Cabecalho({ titulo, voltar, direita }: CabecalhoProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const aoVoltar = typeof voltar === 'function' ? voltar : () => router.back();

  return (
    <View style={[styles.cabecalho, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.lado}>
        {voltar ? (
          <Pressable
            onPress={aoVoltar}
            hitSlop={12}
            style={styles.botaoVoltar}
            accessibilityRole="button"
            accessibilityLabel="Voltar"
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.titulo} numberOfLines={1}>
        {titulo}
      </Text>
      <View style={[styles.lado, { alignItems: 'flex-end' }]}>{direita}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  cabecalho: {
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lado: { width: 44 },
  botaoVoltar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    flex: 1,
    textAlign: 'center',
    fontFamily: fontFamily.semibold,
    fontSize: 18,
    color: colors.primaryDark,
  },
});
