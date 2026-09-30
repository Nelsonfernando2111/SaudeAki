import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, radius } from '@/src/theme';

interface AbasPilulaProps<T extends string> {
  abas: { chave: T; titulo: string }[];
  ativa: T;
  onMudar: (chave: T) => void;
}

export function AbasPilula<T extends string>({ abas, ativa, onMudar }: AbasPilulaProps<T>) {
  return (
    <View style={styles.container}>
      {abas.map((aba) => {
        const selecionada = aba.chave === ativa;
        return (
          <Pressable
            key={aba.chave}
            onPress={() => onMudar(aba.chave)}
            style={[styles.aba, selecionada && styles.abaAtiva]}
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
    padding: 4,
    gap: 4,
  },
  aba: {
    flex: 1,
    height: 36,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  abaAtiva: { backgroundColor: colors.primary },
  texto: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.textSecondary },
  textoAtivo: { color: colors.white, fontFamily: fontFamily.semibold },
});