import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useVoltar } from '@/src/hooks/useVoltar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useTremor } from '@/src/components/anim/useTremor';
import { Logo } from '@/src/components/shared/Logo';
import { Alerta } from '@/src/components/ui/Alerta';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { paraErroApi } from '@/src/services/api';
import { entrar } from '@/src/services/auth.service';
import { obterMeuPerfilMedico } from '@/src/services/medico.service';
import { useSessaoStore } from '@/src/store/sessao.store';
import { colors, fontFamily, spacing } from '@/src/theme';

const schema = z.object({
  email: z.string().min(1, 'Informe o seu email').email('Email inválido'),
  senha: z.string().min(1, 'Informe a sua senha'),
});

type Form = z.infer<typeof schema>;

export default function LoginMedico() {
  const router = useRouter();
  const voltar = useVoltar('/(auth)/escolher-perfil');
  const insets = useSafeAreaInsets();
  const definirMedico = useSessaoStore((s) => s.definirMedico);
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const { estilo, tremer } = useTremor();

  const { control, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', senha: '' },
  });

  const aoEntrar = handleSubmit(
    async (dados) => {
      setErroGeral(null);
      try {
        await entrar(dados.email, dados.senha, 'medico');
        definirMedico(await obterMeuPerfilMedico());
        router.replace('/(medico)/(tabs)' as any);
      } catch (e) {
        setErroGeral(paraErroApi(e).message);
        tremer();
      }
    },
    () => tremer()
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={voltar} hitSlop={12} style={styles.voltar}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.primary} />
        </Pressable>

        <View style={styles.logo}>
          <Logo tamanho={84} variante="escuro" />
          <Text style={styles.slogan}>Acesso seguro para profissionais de saúde</Text>
        </View>

        <Animated.View style={estilo}>
          <Alerta mensagem={erroGeral} />

          <Controller
            control={control}
            name="email"
            render={({ field, fieldState }) => (
              <Input
                label="Email"
                icone="email-outline"
                placeholder="seu.email@hospital.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                erro={fieldState.error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="senha"
            render={({ field, fieldState }) => (
              <Input
                senha
                label="Senha"
                icone="lock-outline"
                placeholder="Digite sua senha"
                autoCapitalize="none"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                onSubmitEditing={aoEntrar}
                erro={fieldState.error?.message}
              />
            )}
          />
        </Animated.View>

        <View style={styles.espaco} />
        <Button titulo="Entrar" onPress={aoEntrar} carregando={formState.isSubmitting} />

        <Text style={styles.dica}>
          As contas de médico são criadas pelo administrador da plataforma.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface },
  scroll: { paddingHorizontal: spacing.xl },
  voltar: {
    alignSelf: 'flex-start',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: { alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.xxl },
  slogan: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 240,
  },
  espaco: { height: 8 },
  dica: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
