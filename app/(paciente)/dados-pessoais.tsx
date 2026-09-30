import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useSessaoStore } from '@/src/store/sessao.store';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

function Campo({ label, valor, ultimo }: { label: string; valor?: string; ultimo?: boolean }) {
  return (
    <View style={[styles.campo, !ultimo && styles.separador]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.valor}>{valor && valor.length > 0 ? valor : '—'}</Text>
    </View>
  );
}

export default function DadosPessoais() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const paciente = useSessaoStore((s) => s.paciente);

  if (!paciente) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.cabecalho, { paddingTop: insets.top + spacing.md }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
        </Pressable>
        <Text style={styles.cabecalhoTitulo}>Dados pessoais</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.cartao}>
          <Campo label="Nome completo" valor={paciente.nome} />
          <Campo label="Código único" valor={paciente.codigo} />
          <Campo label="Email" valor={paciente.email} />
          <Campo label="Telefone" valor={paciente.telefone} />
          <Campo label="Tipo sanguíneo" valor={paciente.tipoSanguineo} ultimo />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  cabecalho: {
    backgroundColor: colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  cabecalhoTitulo: { fontFamily: fontFamily.semibold, fontSize: 18, color: colors.white },
  scroll: { padding: spacing.xl },
  cartao: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  campo: { paddingVertical: spacing.lg },
  separador: { borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textSecondary },
  valor: { fontFamily: fontFamily.medium, fontSize: 15, color: colors.text, marginTop: 2 },
});