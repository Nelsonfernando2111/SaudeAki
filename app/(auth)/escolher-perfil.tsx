import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Logo } from '@/src/components/shared/Logo';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface CartaoPerfilProps {
  icone: IconName;
  titulo: string;
  descricao: string;
  onPress: () => void;
}

function CartaoPerfil({ icone, titulo, descricao, onPress }: CartaoPerfilProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cartao, pressed && styles.cartaoPressionado]}
      accessibilityRole="button"
      accessibilityLabel={titulo}
    >
      <View style={styles.iconeContainer}>
        <MaterialCommunityIcons name={icone} size={28} color={colors.primary} />
      </View>

      <View style={styles.cartaoTextos}>
        <Text style={styles.cartaoTitulo}>{titulo}</Text>
        <Text style={styles.cartaoDescricao}>{descricao}</Text>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
    </Pressable>
  );
}

export default function EscolherPerfil() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xl },
      ]}
    >
      <View style={styles.topo}>
        <Logo tamanho={84} mostrarSlogan variante="claro" />
      </View>

      <View style={styles.conteudo}>
        <Text style={styles.titulo}>Bem-vindo(a)</Text>
        <Text style={styles.subtitulo}>Como deseja aceder à plataforma?</Text>

        <View style={styles.cartoes}>
          <CartaoPerfil
            icone="stethoscope"
            titulo="Sou Médico"
            descricao="Acesso seguro para profissionais de saúde"
            onPress={() => router.push('/(auth)/login-medico' as any)}
          />
          <CartaoPerfil
            icone="account-heart-outline"
            titulo="Sou Paciente"
            descricao="Consulte e controle o seu histórico clínico"
            onPress={() => router.push('/(auth)/login-paciente' as any)}
          />
        </View>
      </View>

      <Text style={styles.rodape}>Os seus dados de saúde, protegidos e sempre consigo.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.xl,
  },
  topo: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  conteudo: {
    flex: 1,
    justifyContent: 'center',
  },
  titulo: {
    fontFamily: fontFamily.semibold,
    fontSize: 24,
    color: colors.white,
    textAlign: 'center',
  },
  subtitulo: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  cartoes: {
    marginTop: spacing.xl,
    gap: spacing.lg,
  },
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cartaoPressionado: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  iconeContainer: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartaoTextos: {
    flex: 1,
  },
  cartaoTitulo: {
    fontFamily: fontFamily.semibold,
    fontSize: 18,
    color: colors.text,
  },
  cartaoDescricao: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rodape: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
});