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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Logo } from '@/src/components/shared/Logo';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { loginMedico } from '@/src/services/medico.service';
import { useSessaoStore } from '@/src/store/sessao.store';
import { guardarSessao } from '@/src/utils/sessao';
import { colors, fontFamily, spacing } from '@/src/theme';

const schema = z.object({
  email: z.string().min(1, 'Informe o seu email').email('Email inválido'),
  senha: z.string().min(1, 'Informe a sua senha'),
});

type Form = z.infer<typeof schema>;

export default function LoginMedico() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const definirMedico = useSessaoStore((s) => s.definirMedico);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const { control, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', senha: '' },
  });

  const aoEntrar = handleSubmit(async (dados) => {
    setErroGeral(null);
    try {
      const sessao = await loginMedico(dados.email, dados.senha);
      await guardarSessao({ perfil: 'medico', token: sessao.token, id: sessao.medico.id });
      definirMedico(sessao.medico);
      router.replace('/(medico)/(tabs)' as any);
    } catch (e) {
      setErroGeral(e instanceof Error ? e.message : 'Não foi possível entrar.');
    }
  });

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
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.voltar}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
        </Pressable>

        <View style={styles.logo}>
          <Logo tamanho={84} variante="claro" />
          <Text style={styles.slogan}>Acesso seguro para profissionais de saúde</Text>
        </View>

        {erroGeral ? (
          <View style={styles.alerta}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.error} />
            <Text style={styles.alertaTexto}>{erroGeral}</Text>
          </View>
        ) : null}

        <Controller
          control={control}
          name="email"
          render={({ field, fieldState }) => (
            <Input
              escuro
              label="Email"
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
              escuro
              senha
              label="Senha"
              placeholder="Digite sua senha"
              autoCapitalize="none"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              erro={fieldState.error?.message}
            />
          )}
        />

        <View style={styles.espaco} />
        <Button titulo="Entrar" onPress={aoEntrar} carregando={formState.isSubmitting} />

        <Pressable style={styles.esqueceu} onPress={() => {}} hitSlop={8}>
          <Text style={styles.esqueceuTexto}>Esqueceu a senha?</Text>
        </Pressable>

        <Text style={styles.dica}>Demo: joao.silva@hospital.com / 123456</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.primaryDark },
  scroll: { paddingHorizontal: spacing.xl },
  voltar: { alignSelf: 'flex-start', padding: 4 },
  logo: { alignItems: 'center', marginTop: spacing.lg, marginBottom: spacing.xxl },
  slogan: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 240,
  },
  alerta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.errorSoft,
    padding: 12,
    borderRadius: 10,
    marginBottom: spacing.lg,
  },
  alertaTexto: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.error,
  },
  espaco: { height: 8 },
  esqueceu: { alignSelf: 'center', marginTop: spacing.lg, padding: 6 },
  esqueceuTexto: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    textDecorationLine: 'underline',
  },
  dica: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});