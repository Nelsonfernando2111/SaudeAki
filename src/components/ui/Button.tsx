import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, fontFamily, radius } from '@/src/theme';

interface ButtonProps {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario' | 'perigo' | 'link';
  carregando?: boolean;
  desativado?: boolean;
}

export function Button({
  titulo,
  onPress,
  variante = 'primario',
  carregando = false,
  desativado = false,
}: ButtonProps) {
  const inativo = desativado || carregando;
  const corTexto =
    variante === 'primario' || variante === 'perigo'
      ? colors.white
      : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={inativo}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        variante === 'primario' && styles.primario,
        variante === 'secundario' && styles.secundario,
        variante === 'perigo' && styles.perigo,
        variante === 'link' && styles.link,
        inativo && styles.inativo,
        pressed && { opacity: 0.85 },
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <Text
          style={[
            styles.texto,
            { color: corTexto },
            variante === 'link' && styles.textoLink,
          ]}
        >
          {titulo}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primario: { backgroundColor: colors.primary },
  secundario: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  perigo: { backgroundColor: colors.error },
  link: { height: 40, backgroundColor: 'transparent' },
  inativo: { opacity: 0.6 },
  texto: { fontFamily: fontFamily.semibold, fontSize: 16 },
  textoLink: { fontSize: 14, textDecorationLine: 'underline' },
});