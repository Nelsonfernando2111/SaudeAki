import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tocavel } from '@/src/components/anim/Tocavel';
import { colors, fontFamily, radius } from '@/src/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type Variante = 'primario' | 'secundario' | 'perigo' | 'perigoContorno' | 'sucesso' | 'link';

interface ButtonProps {
  titulo: string;
  onPress: () => void;
  variante?: Variante;
  icone?: IconName;
  carregando?: boolean;
  desativado?: boolean;
}

const COR_TEXTO: Record<Variante, string> = {
  primario: colors.white,
  sucesso: colors.white,
  perigo: colors.white,
  secundario: colors.primary,
  perigoContorno: colors.error,
  link: colors.primary,
};

const COR_RIPPLE: Record<Variante, string> = {
  primario: 'rgba(255,255,255,0.28)',
  sucesso: 'rgba(255,255,255,0.28)',
  perigo: 'rgba(255,255,255,0.28)',
  secundario: 'rgba(37,99,235,0.14)',
  perigoContorno: 'rgba(239,68,68,0.14)',
  link: 'rgba(37,99,235,0.10)',
};

export function Button({
  titulo,
  onPress,
  variante = 'primario',
  icone,
  carregando = false,
  desativado = false,
}: ButtonProps) {
  const inativo = desativado || carregando;
  const corTexto = COR_TEXTO[variante];

  return (
    <Tocavel
      onPress={onPress}
      disabled={inativo}
      accessibilityRole="button"
      accessibilityState={{ disabled: inativo, busy: carregando }}
      corRipple={COR_RIPPLE[variante]}
      style={[styles.base, styles[variante], inativo && styles.inativo]}
    >
      {carregando ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <View style={styles.linha}>
          {icone ? <MaterialCommunityIcons name={icone} size={20} color={corTexto} /> : null}
          <Text style={[styles.texto, { color: corTexto }, variante === 'link' && styles.textoLink]}>
            {titulo}
          </Text>
        </View>
      )}
    </Tocavel>
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
  linha: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primario: { backgroundColor: colors.primary },
  sucesso: { backgroundColor: colors.success },
  perigo: { backgroundColor: colors.error },
  secundario: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  perigoContorno: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  link: { height: 40, backgroundColor: 'transparent' },
  inativo: { opacity: 0.6 },
  texto: { fontFamily: fontFamily.semibold, fontSize: 16 },
  textoLink: { fontSize: 14, textDecorationLine: 'underline' },
});
