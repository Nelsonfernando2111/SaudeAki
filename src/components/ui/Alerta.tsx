import { StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fontFamily, spacing } from '@/src/theme';

/** Caixa de erro inline (aparece com fade) */
export function Alerta({ mensagem }: { mensagem: string | null }) {
  if (!mensagem) return null;
  return (
    <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOut.duration(150)} style={styles.alerta}>
      <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.error} />
      <Text style={styles.texto}>{mensagem}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  alerta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.errorSoft,
    padding: 12,
    borderRadius: 10,
    marginBottom: spacing.lg,
  },
  texto: { flex: 1, fontFamily: fontFamily.regular, fontSize: 13, color: colors.error },
});
