import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { LinhaInfo } from '@/src/components/ui/LinhaInfo';
import { Button } from '@/src/components/ui/Button';
import { useSessaoStore } from '@/src/store/sessao.store';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

const plural = (n: number) => `${n} ${n === 1 ? 'registada' : 'registadas'}`;

export default function Perfil() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const paciente = useSessaoStore((s) => s.paciente);
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

  if (!paciente) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.cabecalho, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.cabecalhoTitulo}>Meu Perfil</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar e identificação */}
        <View style={styles.identificacao}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account" size={56} color={colors.primary} />
          </View>
          <Text style={styles.nome}>{paciente.nome}</Text>
          <Text style={styles.codigo}>{paciente.codigo}</Text>
        </View>

        {/* Lista */}
        <View style={styles.cartao}>
          <LinhaInfo
            icone="account-outline"
            titulo="Dados pessoais"
            onPress={() => router.push('/(paciente)/dados-pessoais' as any)}
          />
          <LinhaInfo
            icone="water-outline"
            cor={colors.error}
            titulo="Tipo sanguíneo"
            valor={paciente.tipoSanguineo}
          />
          <LinhaInfo
            icone="flower-pollen-outline"
            cor={colors.error}
            titulo="Alergias"
            valor={plural(paciente.alergias.length)}
            onPress={() => router.push('/(paciente)/(tabs)/historico' as any)}
          />
          <LinhaInfo
            icone="heart-pulse"
            cor={colors.warning}
            titulo="Condições crónicas"
            valor={plural(paciente.condicoesCronicas.length)}
            onPress={() => router.push('/(paciente)/(tabs)/historico' as any)}
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
  nome: {
    fontFamily: fontFamily.semibold,
    fontSize: 18,
    color: colors.text,
    textAlign: 'center',
  },
  codigo: {
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