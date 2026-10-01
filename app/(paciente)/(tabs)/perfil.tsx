import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Avatar } from '@/src/components/ui/Avatar';
import { Button } from '@/src/components/ui/Button';
import { LinhaInfo } from '@/src/components/ui/LinhaInfo';
import { useSessaoStore } from '@/src/store/sessao.store';
import { tipoSanguineo } from '@/src/utils/clinico';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

export default function Perfil() {
  const router = useRouter();
  const paciente = useSessaoStore((s) => s.paciente);
  const sair = useSessaoStore((s) => s.sair);
  const [aSair, setASair] = useState(false);

  function confirmarSaida() {
    Alert.alert('Terminar sessão', 'Tem a certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: async () => {
          setASair(true);
          await sair();
          router.replace('/(auth)/escolher-perfil' as any);
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(350)} style={styles.identificacao}>
          <Avatar nome={paciente?.nomeCompleto} tamanho={96} />
          <Text style={styles.nome}>{paciente?.nomeCompleto ?? '—'}</Text>
          <Text style={styles.codigo}>
            {paciente?.codUnico}
            {paciente?.idade != null ? ` · ${paciente.idade} anos` : ''}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(350)} style={styles.cartao}>
          <LinhaInfo
            icone="account-edit-outline"
            titulo="Dados pessoais"
            onPress={() => router.push('/(paciente)/dados-pessoais' as any)}
          />
          <LinhaInfo
            icone="water-outline"
            cor={colors.error}
            titulo="Tipo sanguíneo"
            valor={tipoSanguineo(paciente?.grupoSanguineo, paciente?.fatorRh)}
          />
          <LinhaInfo icone="phone-outline" titulo="Telefone" valor={paciente?.telefone} />
          <LinhaInfo
            icone="shield-lock-outline"
            titulo="Quem acedeu aos meus dados"
            onPress={() => router.push('/(paciente)/(tabs)/acessos' as any)}
          />
          <LinhaInfo
            icone="lock-reset"
            titulo="Alterar senha"
            onPress={() => router.push('/alterar-senha' as any)}
            ultima
          />
        </Animated.View>

        <View style={styles.sair}>
          <Button
            titulo="Terminar sessão"
            icone="logout"
            variante="perigoContorno"
            onPress={confirmarSaida}
            carregando={aSair}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl },
  identificacao: { alignItems: 'center', marginBottom: spacing.xl, gap: 2 },
  nome: {
    fontFamily: fontFamily.semibold,
    fontSize: 18,
    color: colors.primaryDark,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  codigo: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.textSecondary },
  cartao: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  sair: { marginTop: spacing.xl },
});
