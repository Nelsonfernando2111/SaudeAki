import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Tocavel } from '@/src/components/anim/Tocavel';
import { Avatar } from '@/src/components/ui/Avatar';
import type { PacienteRecente } from '@/src/store/recentes.store';
import { formatarDiaRelativo } from '@/src/utils/datas';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

/** Paciente aberto recentemente pelo médico: toque abre a ficha */
export function CartaoPacienteRecente({ paciente }: { paciente: PacienteRecente }) {
  const router = useRouter();
  return (
    <Tocavel
      onPress={() => router.push(`/(medico)/paciente/${paciente.codUnico}` as any)}
      style={styles.cartao}
      accessibilityRole="button"
    >
      <Avatar nome={paciente.nome} tagTransicao={`paciente-${paciente.codUnico}`} />
      <View style={{ flex: 1 }}>
        <Text style={styles.nome}>{paciente.nome}</Text>
        <Text style={styles.meta}>
          {paciente.codUnico} · {formatarDiaRelativo(paciente.vistoEm)}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
    </Tocavel>
  );
}

const styles = StyleSheet.create({
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  nome: { fontFamily: fontFamily.semibold, fontSize: 15, color: colors.text },
  meta: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textSecondary, marginTop: 1 },
});
