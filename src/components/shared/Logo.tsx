import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fontFamily } from '@/src/theme';

interface LogoProps {
  tamanho?: number;
  mostrarTexto?: boolean;
  mostrarSlogan?: boolean;
  /** 'claro' = logo branco (fundos escuros) | 'escuro' = logo azul (fundos claros) */
  variante?: 'claro' | 'escuro';
}

export function Logo({
  tamanho = 96,
  mostrarTexto = true,
  mostrarSlogan = false,
  variante = 'claro',
}: LogoProps) {
  const corCoracao = variante === 'claro' ? colors.white : colors.primary;
  const corCruz = variante === 'claro' ? colors.primaryDark : colors.white;
  const corTexto = variante === 'claro' ? colors.white : colors.primaryDark;
  const corSlogan = variante === 'claro' ? 'rgba(255,255,255,0.75)' : colors.textSecondary;

  return (
    <View style={styles.container}>
      <View style={{ width: tamanho, height: tamanho }}>
        <MaterialCommunityIcons
          name="heart"
          size={tamanho}
          color={corCoracao}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.cruz}>
          <MaterialCommunityIcons name="plus-thick" size={tamanho * 0.5} color={corCruz} />
        </View>
      </View>

      {mostrarTexto && (
        <Text style={[styles.nome, { color: corTexto, fontSize: tamanho * 0.3 }]}>IDCLIN</Text>
      )}
      {mostrarSlogan && (
        <Text style={[styles.slogan, { color: corSlogan }]}>A sua saúde, sempre consigo</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  cruz: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
  },
  nome: {
    fontFamily: fontFamily.bold,
    letterSpacing: 2,
    marginTop: 12,
  },
  slogan: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    marginTop: 6,
  },
});