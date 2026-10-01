import { StyleSheet, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { colors, fontFamily } from '@/src/theme';

interface AvatarProps {
  nome?: string | null;
  tamanho?: number;
  cor?: string;
  fundo?: string;
  /** Mesmo valor na lista e no detalhe = Shared Element Transition */
  tagTransicao?: string;
}

function iniciais(nome?: string | null) {
  if (!nome) return '?';
  const partes = nome.replace(/^Dr[a]?\.?\s+/i, '').trim().split(/\s+/);
  const a = partes[0]?.[0] ?? '';
  const b = partes.length > 1 ? partes[partes.length - 1][0] : '';
  return (a + b).toUpperCase() || '?';
}

/** Círculo com as iniciais da pessoa */
export function Avatar({
  nome,
  tamanho = 44,
  cor = colors.primary,
  fundo = colors.primarySoft,
  tagTransicao,
}: AvatarProps) {
  return (
    <Animated.View
      sharedTransitionTag={tagTransicao}
      style={[
        styles.avatar,
        { width: tamanho, height: tamanho, borderRadius: tamanho / 2, backgroundColor: fundo },
      ]}
    >
      <Text style={[styles.texto, { color: cor, fontSize: tamanho * 0.38 }]}>{iniciais(nome)}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center' },
  texto: { fontFamily: fontFamily.semibold },
});
