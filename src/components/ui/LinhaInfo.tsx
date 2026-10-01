import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tocavel } from '@/src/components/anim/Tocavel';
import { colors, fontFamily, spacing } from '@/src/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface LinhaInfoProps {
  icone: IconName;
  cor?: string;
  titulo: string;
  valor?: string | null;
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
  const conteudo = (
    <>
      <MaterialCommunityIcons name={icone} size={22} color={cor} />
      <Text style={styles.titulo}>{titulo}</Text>
      {valor ? (
        <Text style={styles.valor} numberOfLines={1}>
          {valor}
        </Text>
      ) : null}
      {onPress ? (
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={[styles.linha, !ultima && styles.separador]}>{conteudo}</View>;
  }

  return (
    <Tocavel
      onPress={onPress}
      escala={0.99}
      accessibilityRole="button"
      style={[styles.linha, !ultima && styles.separador]}
    >
      {conteudo}
    </Tocavel>
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
    maxWidth: '50%',
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
});
