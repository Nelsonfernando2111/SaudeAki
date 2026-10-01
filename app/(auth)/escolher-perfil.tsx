import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tocavel } from '@/src/components/anim/Tocavel';
import { Logo } from '@/src/components/shared/Logo';
import { colors, fontFamily, radius, sombra, spacing } from '@/src/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface CartaoPerfilProps {
  icone: IconName;
  titulo: string;
  descricao: string;
  onPress: () => void;
}

function CartaoPerfil({ icone, titulo, descricao, onPress }: CartaoPerfilProps) {
  return (
    <Tocavel
      onPress={onPress}
      style={styles.cartao}
      accessibilityRole="button"
      accessibilityLabel={titulo}
    >
      <View style={styles.iconeContainer}>
        <MaterialCommunityIcons name={icone} size={28} color={colors.white} />
      </View>

      <View style={styles.cartaoTextos}>
        <Text style={styles.cartaoTitulo}>{titulo}</Text>
        <Text style={styles.cartaoDescricao}>{descricao}</Text>
      </View>

      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.primary} />
    </Tocavel>
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
      <Animated.View entering={FadeInDown.duration(500)} style={styles.topo}>
        <Logo tamanho={84} mostrarSlogan variante="escuro" />
      </Animated.View>

      <View style={styles.conteudo}>
        <Animated.Text entering={FadeInDown.delay(100).duration(450)} style={styles.titulo}>
          Bem-vindo(a)
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(150).duration(450)} style={styles.subtitulo}>
          Como deseja aceder à plataforma?
        </Animated.Text>

        <View style={styles.cartoes}>
          <Animated.View entering={FadeInDown.delay(220).duration(450)}>
            <CartaoPerfil
              icone="stethoscope"
              titulo="Sou Médico"
              descricao="Acesso seguro para profissionais de saúde"
              onPress={() => router.push('/(auth)/login-medico' as any)}
            />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(300).duration(450)}>
            <CartaoPerfil
              icone="account-heart-outline"
              titulo="Sou Paciente"
              descricao="Consulte e controle o seu histórico clínico"
              onPress={() => router.push('/(auth)/login-paciente' as any)}
            />
          </Animated.View>
        </View>
      </View>

      <Text style={styles.rodape}>Os seus dados de saúde, protegidos e sempre consigo.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
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
    color: colors.primaryDark,
    textAlign: 'center',
  },
  subtitulo: {
    fontFamily: fontFamily.regular,
    fontSize: 16,
    color: colors.textSecondary,
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
    backgroundColor: colors.primaryFaint,
    borderWidth: 1,
    borderColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  iconeContainer: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...sombra,
  },
  cartaoTextos: {
    flex: 1,
  },
  cartaoTitulo: {
    fontFamily: fontFamily.semibold,
    fontSize: 18,
    color: colors.primaryDark,
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
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
