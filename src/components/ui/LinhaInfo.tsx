import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fontFamily, spacing } from '@/src/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface LinhaInfoProps {
  icone: IconName;
  cor?: string;
  titulo: string;
  valor?: string;
  onPress?: () => void;
  ultima?: boolean;
}

export function LinhaInfo({
  icone,
  cor = colors.primary,
  titulo,
  valor,
  onPress,
  ultima = false,
}: LinhaInfoProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.linha,
        !ultima && styles.separador,
        pressed && { opacity: 0.7 },
      ]}
    >
      <MaterialCommunityIcons name={icone} size={22} color={cor} />
      <Text style={styles.titulo}>{titulo}</Text>
      {valor ? <Text style={styles.valor}>{valor}</Text> : null}
      {onPress ? (
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  separador: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titulo: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: 15,
    color: colors.text,
  },
  valor: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
});