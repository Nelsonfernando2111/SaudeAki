import { StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export interface Destaque {
  icone: IconName;
  texto: string;
  /** Alerta clínico (vermelho) ou informação neutra */
  alerta?: boolean;
}

/** Alertas clínicos no topo da ficha/histórico (ex.: diabético, medicação ativa) */
export function Destaques({ itens }: { itens: Destaque[] }) {
  if (itens.length === 0) return null;
  return (
    <View style={styles.linha}>
      {itens.map((d, i) => (
        <Animated.View
          key={d.texto}
          entering={ZoomIn.delay(i * 80).springify().damping(14)}
          style={[styles.chip, d.alerta ? styles.chipAlerta : styles.chipInfo]}
        >
          <MaterialCommunityIcons name={d.icone} size={16} color={d.alerta ? colors.error : colors.primary} />
          <Text style={[styles.texto, { color: d.alerta ? colors.error : colors.primaryDark }]}>{d.texto}</Text>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  chipAlerta: { backgroundColor: colors.errorSoft, borderColor: '#FECACA' },
  chipInfo: { backgroundColor: colors.primaryFaint, borderColor: colors.primarySoft },
  texto: { fontFamily: fontFamily.semibold, fontSize: 13 },
});
