import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, fontFamily, radius } from '@/src/theme';

interface AbasPilulaProps<T extends string> {
  abas: { chave: T; titulo: string }[];
  ativa: T;
  onMudar: (chave: T) => void;
}

const PADDING = 4;

/** Abas em pílula com indicador que desliza para a aba ativa */
export function AbasPilula<T extends string>({ abas, ativa, onMudar }: AbasPilulaProps<T>) {
  const [largura, setLargura] = useState(0);
  const indice = Math.max(0, abas.findIndex((a) => a.chave === ativa));
  const larguraAba = largura > 0 ? (largura - PADDING * 2) / abas.length : 0;
  const x = useSharedValue(0);

  useEffect(() => {
    x.value = withSpring(indice * larguraAba, { damping: 20, stiffness: 220 });
  }, [indice, larguraAba, x]);

  const estiloIndicador = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={styles.container} onLayout={(e) => setLargura(e.nativeEvent.layout.width)}>
      {larguraAba > 0 ? (
        <Animated.View style={[styles.indicador, { width: larguraAba }, estiloIndicador]} />
      ) : null}
      {abas.map((aba) => {
        const selecionada = aba.chave === ativa;
        return (
          <Pressable
            key={aba.chave}
            onPress={() => onMudar(aba.chave)}
            style={styles.aba}
            accessibilityRole="tab"
            accessibilityState={{ selected: selecionada }}
          >
            <Text style={[styles.texto, selecionada && styles.textoAtivo]}>{aba.titulo}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    padding: PADDING,
  },
  indicador: {
    position: 'absolute',
    top: PADDING,
    left: PADDING,
    bottom: PADDING,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  aba: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texto: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.textSecondary },
  textoAtivo: { color: colors.white, fontFamily: fontFamily.semibold },
});
