import { StyleSheet, Text, View } from 'react-native';
import { Tocavel } from '@/src/components/anim/Tocavel';
import { colors, fontFamily, radius } from '@/src/theme';

interface OpcoesProps<T extends string | number> {
  label?: string;
  opcoes: { valor: T; titulo: string }[];
  valor: T | null | undefined;
  onMudar: (valor: T | null) => void;
  /** Permite desmarcar (valor opcional) */
  limpavel?: boolean;
  erro?: string;
}

/** Grupo de "chips" para escolher um valor de um enum */
export function Opcoes<T extends string | number>({
  label,
  opcoes,
  valor,
  onMudar,
  limpavel = false,
  erro,
}: OpcoesProps<T>) {
  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.linha}>
        {opcoes.map((o) => {
          const ativa = o.valor === valor;
          return (
            <Tocavel
              key={String(o.valor)}
              onPress={() => onMudar(ativa && limpavel ? null : o.valor)}
              style={[styles.chip, ativa && styles.chipAtivo]}
              escala={0.94}
              accessibilityRole="radio"
              accessibilityState={{ selected: ativa }}
            >
              <Text style={[styles.texto, ativa && styles.textoAtivo]}>{o.titulo}</Text>
            </Tocavel>
          );
        })}
      </View>
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontFamily: fontFamily.medium, fontSize: 14, color: colors.text, marginBottom: 8 },
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    height: 38,
    justifyContent: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipAtivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  texto: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.text },
  textoAtivo: { color: colors.white },
  erro: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.error, marginTop: 4 },
});
