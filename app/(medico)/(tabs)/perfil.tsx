import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Button } from '@/src/components/ui/Button';
import { LinhaInfo } from '@/src/components/ui/LinhaInfo';
import { useSessaoStore } from '@/src/store/sessao.store';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

export default function PerfilMedico() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const medico = useSessaoStore((s) => s.medico);
  const sair = useSessaoStore((s) => s.sair);

  function confirmarSaida() {
    Alert.alert('Terminar sessão', 'Tem a certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          await sair();
          router.replace('/(auth)/escolher-perfil' as any);
        },
      },
    ]);
  }

  if (!medico) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.cabecalho, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.cabecalhoTitulo}>Meu Perfil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.identificacao}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="stethoscope" size={48} color={colors.primary} />
          </View>
          <Text style={styles.nome}>{medico.nome}</Text>
          <Text style={styles.unidade}>{medico.unidadeSanitaria}</Text>
        </View>

        <View style={styles.cartao}>
          <LinhaInfo icone="account-outline" titulo="Nome" valor={medico.nome} />
          <LinhaInfo icone="email-outline" titulo="Email" valor={medico.email} />
          <LinhaInfo
            icone="hospital-building"
            titulo="Unidade sanitária"
            valor={medico.unidadeSanitaria}
            ultima
          />
        </View>

        <View style={styles.sair}>
          <Button titulo="Terminar sessão" variante="perigo" onPress={confirmarSaida} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  cabecalho: {
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
  cabecalhoTitulo: { fontFamily: fontFamily.semibold, fontSize: 18, color: colors.white },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl },
  identificacao: { alignItems: 'center', marginBottom: spacing.xl },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  nome: { fontFamily: fontFamily.semibold, fontSize: 18, color: colors.text, textAlign: 'center' },
  unidade: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  cartao: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  sair: { marginTop: spacing.xl },
});