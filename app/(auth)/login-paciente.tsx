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
import { loginPaciente, registarPaciente } from '@/src/services/paciente.service';
import { useSessaoStore } from '@/src/store/sessao.store';
import { guardarSessao } from '@/src/utils/sessao';
import { colors, fontFamily, spacing } from '@/src/theme';

/* ---------- Validação ---------- */

const loginSchema = z.object({
  identificador: z.string().min(1, 'Informe o código, email ou telefone'),
  senha: z.string().min(1, 'Informe a sua senha'),
});

const registoSchema = z
  .object({
    nome: z.string().min(3, 'Informe o nome completo'),
    contacto: z
      .string()
      .min(1, 'Informe o email ou telefone')
      .refine(
        (v) => v.includes('@') || /^\d{9,}$/.test(v.replace(/\s/g, '')),
        'Email ou telefone inválido'
      ),
    senha: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
    confirmar: z.string().min(1, 'Confirme a senha'),
  })
  .refine((d) => d.senha === d.confirmar, {
    message: 'As senhas não coincidem',
    path: ['confirmar'],
  });

type LoginForm = z.infer<typeof loginSchema>;
type RegistoForm = z.infer<typeof registoSchema>;

/* ---------- Tela ---------- */

export default function LoginPaciente() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const definirPaciente = useSessaoStore((s) => s.definirPaciente);

  const [aba, setAba] = useState<'entrar' | 'registar'>('entrar');
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const formLogin = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identificador: '', senha: '' },
  });

  const formRegisto = useForm<RegistoForm>({
    resolver: zodResolver(registoSchema),
    defaultValues: { nome: '', contacto: '', senha: '', confirmar: '' },
  });

  async function concluir(sessao: Awaited<ReturnType<typeof loginPaciente>>) {
    await guardarSessao({ perfil: 'paciente', token: sessao.token, id: sessao.paciente.id });
    definirPaciente(sessao.paciente);
    router.replace('/(paciente)/(tabs)' as any);
  }

  const aoEntrar = formLogin.handleSubmit(async (dados) => {
    setErroGeral(null);
    try {
      await concluir(await loginPaciente(dados.identificador, dados.senha));
    } catch (e) {
      setErroGeral(e instanceof Error ? e.message : 'Não foi possível entrar.');
    }
  });

  const aoRegistar = formRegisto.handleSubmit(async (dados) => {
    setErroGeral(null);
    try {
      await concluir(
        await registarPaciente({
          nome: dados.nome,
          contacto: dados.contacto,
          senha: dados.senha,
        })
      );
    } catch (e) {
      setErroGeral(e instanceof Error ? e.message : 'Não foi possível registar.');
    }
  });

  function mudarAba(nova: 'entrar' | 'registar') {
    setErroGeral(null);
    setAba(nova);
  }

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
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </Pressable>

        <View style={styles.logo}>
          <Logo tamanho={72} mostrarSlogan variante="escuro" />
        </View>

        {/* Abas */}
        <View style={styles.abas}>
          {(['entrar', 'registar'] as const).map((item) => (
            <Pressable key={item} style={styles.aba} onPress={() => mudarAba(item)}>
              <Text style={[styles.abaTexto, aba === item && styles.abaTextoAtiva]}>
                {item === 'entrar' ? 'Entrar' : 'Registar'}
              </Text>
              <View style={[styles.abaLinha, aba === item && styles.abaLinhaAtiva]} />
            </Pressable>
          ))}
        </View>

        {erroGeral ? (
          <View style={styles.alerta}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.error} />
            <Text style={styles.alertaTexto}>{erroGeral}</Text>
          </View>
        ) : null}

        {aba === 'entrar' ? (
          <View>
            <Controller
              control={formLogin.control}
              name="identificador"
              render={({ field, fieldState }) => (
                <Input
                  label="Código / Email / Telefone"
                  placeholder="Digite seu código único, email ou telefone"
                  autoCapitalize="none"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  erro={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={formLogin.control}
              name="senha"
              render={({ field, fieldState }) => (
                <Input
                  label="Senha"
                  placeholder="Digite sua senha"
                  senha
                  autoCapitalize="none"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  erro={fieldState.error?.message}
                />
              )}
            />

            <View style={styles.espaco} />
            <Button
              titulo="Entrar"
              onPress={aoEntrar}
              carregando={formLogin.formState.isSubmitting}
            />
            <View style={styles.centro}>
              <Button titulo="Esqueceu a senha?" variante="link" onPress={() => {}} />
            </View>

            <View style={styles.dica}>
              <Text style={styles.dicaTexto}>
                Demo: IDCLIN-4F9T2 / 123456
              </Text>
            </View>
          </View>
        ) : (
          <View>
            <Controller
              control={formRegisto.control}
              name="nome"
              render={({ field, fieldState }) => (
                <Input
                  label="Nome completo"
                  placeholder="Digite o seu nome completo"
                  autoCapitalize="words"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  erro={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={formRegisto.control}
              name="contacto"
              render={({ field, fieldState }) => (
                <Input
                  label="Email / Telefone"
                  placeholder="Digite o seu email ou telefone"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  erro={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={formRegisto.control}
              name="senha"
              render={({ field, fieldState }) => (
                <Input
                  label="Senha"
                  placeholder="Mínimo 6 caracteres"
                  senha
                  autoCapitalize="none"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  erro={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={formRegisto.control}
              name="confirmar"
              render={({ field, fieldState }) => (
                <Input
                  label="Confirmar senha"
                  placeholder="Repita a senha"
                  senha
                  autoCapitalize="none"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  erro={fieldState.error?.message}
                />
              )}
            />

            <View style={styles.espaco} />
            <Button
              titulo="Criar conta"
              onPress={aoRegistar}
              carregando={formRegisto.formState.isSubmitting}
            />
          </View>
        )}

        <View style={styles.rodape}>
          <Text style={styles.rodapeTexto}>
            {aba === 'entrar' ? 'Ainda não tem conta? ' : 'Já tem conta? '}
          </Text>
          <Pressable onPress={() => mudarAba(aba === 'entrar' ? 'registar' : 'entrar')}>
            <Text style={styles.rodapeLink}>
              {aba === 'entrar' ? 'Registe-se' : 'Entrar'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingHorizontal: spacing.xl },
  voltar: { alignSelf: 'flex-start', padding: 4 },
  logo: { alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.xl },
  abas: {
    flexDirection: 'row',
    marginBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  aba: { flex: 1, alignItems: 'center', paddingTop: 10 },
  abaTexto: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    color: colors.textSecondary,
    paddingBottom: 10,
  },
  abaTextoAtiva: { color: colors.primaryDark, fontFamily: fontFamily.semibold },
  abaLinha: { height: 2, alignSelf: 'stretch', backgroundColor: 'transparent' },
  abaLinhaAtiva: { backgroundColor: colors.primary },
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
  centro: { alignItems: 'center', marginTop: 8 },
  dica: { alignItems: 'center', marginTop: 8 },
  dicaTexto: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
  },
  rodape: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xxl,
  },
  rodapeTexto: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
  },
  rodapeLink: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    color: colors.primary,
  },
});