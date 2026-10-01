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
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Expansivel } from '@/src/components/anim/Expansivel';
import { PulsoSucesso } from '@/src/components/anim/PulsoSucesso';
import { useTremor } from '@/src/components/anim/useTremor';
import { Logo } from '@/src/components/shared/Logo';
import { AbasPilula } from '@/src/components/ui/AbasPilula';
import { Alerta } from '@/src/components/ui/Alerta';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Opcoes } from '@/src/components/ui/Opcoes';
import { paraErroApi } from '@/src/services/api';
import { entrar, registarPaciente } from '@/src/services/auth.service';
import { obterMeuPerfil } from '@/src/services/paciente.service';
import { useSessaoStore } from '@/src/store/sessao.store';
import { toast } from '@/src/store/toast.store';
import { dataParaApi } from '@/src/utils/datas';
import type { DadosRegisto, FatorRh, GrupoSanguineo } from '@/src/types';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

/* ---------- Validação ---------- */

const loginSchema = z.object({
  identificador: z.string().trim().min(1, 'Informe o seu código único'),
  senha: z.string().min(1, 'Informe a sua senha'),
});

const registoSchema = z
  .object({
    nomeCompleto: z.string().trim().min(3, 'Informe o nome completo'),
    telefone: z
      .string()
      .transform((v) => v.replace(/\s/g, ''))
      .refine((v) => /^\+?\d{9,}$/.test(v), 'Telefone inválido'),
    senha: z.string().min(4, 'A senha deve ter pelo menos 4 caracteres'),
    confirmar: z.string().min(1, 'Confirme a senha'),
    dataNascimento: z
      .string()
      .refine((v) => !v.trim() || dataParaApi(v) !== null, 'Use o formato dd/mm/aaaa'),
    genero: z.string().nullable(),
    cidade: z.string(),
    contactoEmergencia: z.string(),
    grupoSanguineo: z.enum(['A', 'B', 'AB', 'O']).nullable(),
    fatorRh: z.enum(['POSITIVO', 'NEGATIVO']).nullable(),
  })
  .refine((d) => d.senha === d.confirmar, {
    message: 'As senhas não coincidem',
    path: ['confirmar'],
  });

type LoginForm = z.infer<typeof loginSchema>;
type RegistoEntrada = z.input<typeof registoSchema>;
type RegistoForm = z.output<typeof registoSchema>;
type Aba = 'entrar' | 'registar';

const ABAS: { chave: Aba; titulo: string }[] = [
  { chave: 'entrar', titulo: 'Entrar' },
  { chave: 'registar', titulo: 'Registar' },
];

/* ---------- Tela ---------- */

export default function LoginPaciente() {
  const router = useRouter();
  const voltar = useVoltar('/(auth)/escolher-perfil');
  const insets = useSafeAreaInsets();
  const definirPaciente = useSessaoStore((s) => s.definirPaciente);
  const { estilo, tremer } = useTremor();

  const [aba, setAba] = useState<Aba>('entrar');
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  /** Depois do registo: mostra o código gerado antes de entrar */
  const [registado, setRegistado] = useState<{ codUnico: string; senha: string } | null>(null);
  const [aEntrar, setAEntrar] = useState(false);

  const formLogin = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identificador: '', senha: '' },
  });

  const formRegisto = useForm<RegistoEntrada, unknown, RegistoForm>({
    resolver: zodResolver(registoSchema),
    defaultValues: {
      nomeCompleto: '',
      telefone: '',
      senha: '',
      confirmar: '',
      dataNascimento: '',
      genero: null,
      cidade: '',
      contactoEmergencia: '',
      grupoSanguineo: null,
      fatorRh: null,
    },
  });

  async function iniciarSessao(codigo: string, senha: string) {
    await entrar(codigo, senha, 'paciente');
    definirPaciente(await obterMeuPerfil());
    router.replace('/(paciente)/(tabs)' as any);
  }

  const aoEntrar = formLogin.handleSubmit(
    async (dados) => {
      setErroGeral(null);
      try {
        await iniciarSessao(dados.identificador.toUpperCase(), dados.senha);
      } catch (e) {
        setErroGeral(paraErroApi(e).message);
        tremer();
      }
    },
    () => tremer()
  );

  const aoRegistar = formRegisto.handleSubmit(
    async (d) => {
      setErroGeral(null);
      const corpo: DadosRegisto = {
        nomeCompleto: d.nomeCompleto.trim(),
        telefone: d.telefone,
        senha: d.senha,
        dataNascimento: dataParaApi(d.dataNascimento) ?? undefined,
        genero: d.genero ?? undefined,
        cidade: d.cidade.trim() || undefined,
        contactoEmergencia: d.contactoEmergencia.replace(/\s/g, '') || undefined,
        grupoSanguineo: d.grupoSanguineo ?? undefined,
        fatorRh: d.fatorRh ?? undefined,
      };
      try {
        const paciente = await registarPaciente(corpo);
        setRegistado({ codUnico: paciente.codUnico, senha: d.senha });
      } catch (e) {
        setErroGeral(paraErroApi(e).message);
        tremer();
      }
    },
    () => tremer()
  );

  async function continuarAposRegisto() {
    if (!registado) return;
    setAEntrar(true);
    try {
      await iniciarSessao(registado.codUnico, registado.senha);
    } catch (e) {
      toast.erro(paraErroApi(e).message);
      setRegistado(null);
      setAba('entrar');
      formLogin.setValue('identificador', registado.codUnico);
    } finally {
      setAEntrar(false);
    }
  }

  async function copiarCodigo() {
    if (!registado) return;
    await Clipboard.setStringAsync(registado.codUnico);
    toast.sucesso('Código copiado');
  }

  function mudarAba(nova: Aba) {
    setErroGeral(null);
    setAba(nova);
  }

  /* ---------- Conta criada ---------- */
  if (registado) {
    return (
      <View
        style={[
          styles.flex,
          styles.sucesso,
          { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <PulsoSucesso />
        <Animated.Text entering={FadeInDown.delay(200)} style={styles.sucessoTitulo}>
          Conta criada!
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(260)} style={styles.sucessoTexto}>
          Este é o seu código único. Use-o para entrar na aplicação e partilhe-o com o seu médico.
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(340)} style={styles.codigoCaixa}>
          <Text style={styles.codigo}>{registado.codUnico}</Text>
          <Pressable onPress={copiarCodigo} hitSlop={10} style={styles.copiar} accessibilityLabel="Copiar código">
            <MaterialCommunityIcons name="content-copy" size={20} color={colors.primary} />
          </Pressable>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(450)} style={{ alignSelf: 'stretch' }}>
          <Button titulo="Continuar" onPress={continuarAposRegisto} carregando={aEntrar} />
        </Animated.View>
      </View>
    );
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
        <Pressable onPress={voltar} hitSlop={12} style={styles.voltar}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.primary} />
        </Pressable>

        <View style={styles.logo}>
          <Logo tamanho={72} mostrarSlogan variante="escuro" />
        </View>

        <View style={styles.abas}>
          <AbasPilula abas={ABAS} ativa={aba} onMudar={mudarAba} />
        </View>

        <Animated.View style={estilo}>
          <Alerta mensagem={erroGeral} />

          {aba === 'entrar' ? (
            <Animated.View key="entrar" entering={FadeIn.duration(250)}>
              <Controller
                control={formLogin.control}
                name="identificador"
                render={({ field, fieldState }) => (
                  <Input
                    label="Código único"
                    icone="card-account-details-outline"
                    placeholder="PAC-XXXX"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    erro={fieldState.error?.message}
                    ajuda="O código foi gerado quando criou a conta."
                  />
                )}
              />
              <Controller
                control={formLogin.control}
                name="senha"
                render={({ field, fieldState }) => (
                  <Input
                    label="Senha"
                    icone="lock-outline"
                    placeholder="Digite sua senha"
                    senha
                    autoCapitalize="none"
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    onSubmitEditing={aoEntrar}
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
            </Animated.View>
          ) : (
            <Animated.View key="registar" entering={FadeIn.duration(250)}>
              <Controller
                control={formRegisto.control}
                name="nomeCompleto"
                render={({ field, fieldState }) => (
                  <Input
                    label="Nome completo"
                    icone="account-outline"
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
                name="telefone"
                render={({ field, fieldState }) => (
                  <Input
                    label="Telefone"
                    icone="phone-outline"
                    placeholder="84 123 4567"
                    keyboardType="phone-pad"
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
                    icone="lock-outline"
                    placeholder="Mínimo 4 caracteres"
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
                    icone="lock-check-outline"
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

              <View style={styles.opcionais}>
                <Expansivel
                  titulo="Mais dados (opcional)"
                  subtitulo="Pode preencher depois no seu perfil"
                >
                  <View style={{ paddingTop: spacing.sm }}>
                    <Controller
                      control={formRegisto.control}
                      name="dataNascimento"
                      render={({ field, fieldState }) => (
                        <Input
                          label="Data de nascimento"
                          placeholder="dd/mm/aaaa"
                          keyboardType="numbers-and-punctuation"
                          value={field.value}
                          onChangeText={field.onChange}
                          erro={fieldState.error?.message}
                        />
                      )}
                    />
                    <Controller
                      control={formRegisto.control}
                      name="genero"
                      render={({ field }) => (
                        <Opcoes
                          label="Género"
                          limpavel
                          opcoes={[
                            { valor: 'F', titulo: 'Feminino' },
                            { valor: 'M', titulo: 'Masculino' },
                          ]}
                          valor={field.value}
                          onMudar={field.onChange}
                        />
                      )}
                    />
                    <Controller
                      control={formRegisto.control}
                      name="cidade"
                      render={({ field }) => (
                        <Input label="Cidade" placeholder="Ex.: Maputo" value={field.value} onChangeText={field.onChange} />
                      )}
                    />
                    <Controller
                      control={formRegisto.control}
                      name="contactoEmergencia"
                      render={({ field }) => (
                        <Input
                          label="Contacto de emergência"
                          placeholder="84 999 9999"
                          keyboardType="phone-pad"
                          value={field.value}
                          onChangeText={field.onChange}
                        />
                      )}
                    />
                    <Controller
                      control={formRegisto.control}
                      name="grupoSanguineo"
                      render={({ field }) => (
                        <Opcoes<GrupoSanguineo>
                          label="Grupo sanguíneo"
                          limpavel
                          opcoes={(['A', 'B', 'AB', 'O'] as const).map((g) => ({ valor: g, titulo: g }))}
                          valor={field.value}
                          onMudar={field.onChange}
                        />
                      )}
                    />
                    <Controller
                      control={formRegisto.control}
                      name="fatorRh"
                      render={({ field }) => (
                        <Opcoes<FatorRh>
                          label="Fator Rh"
                          limpavel
                          opcoes={[
                            { valor: 'POSITIVO', titulo: 'Positivo (+)' },
                            { valor: 'NEGATIVO', titulo: 'Negativo (−)' },
                          ]}
                          valor={field.value}
                          onMudar={field.onChange}
                        />
                      )}
                    />
                  </View>
                </Expansivel>
              </View>

              <Button
                titulo="Criar conta"
                onPress={aoRegistar}
                carregando={formRegisto.formState.isSubmitting}
              />
            </Animated.View>
          )}
        </Animated.View>

        <View style={styles.rodape}>
          <Text style={styles.rodapeTexto}>
            {aba === 'entrar' ? 'Ainda não tem conta? ' : 'Já tem conta? '}
          </Text>
          <Pressable onPress={() => mudarAba(aba === 'entrar' ? 'registar' : 'entrar')}>
            <Text style={styles.rodapeLink}>{aba === 'entrar' ? 'Registe-se' : 'Entrar'}</Text>
          </Pressable>
        </View>
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
  logo: { alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.xl },
  abas: { marginBottom: spacing.xl },
  espaco: { height: 8 },
  opcionais: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
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

  sucesso: { alignItems: 'center', paddingHorizontal: spacing.xl, gap: spacing.md },
  sucessoTitulo: {
    fontFamily: fontFamily.semibold,
    fontSize: 22,
    color: colors.primaryDark,
    marginTop: spacing.lg,
  },
  sucessoTexto: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  codigoCaixa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primaryFaint,
    borderWidth: 1,
    borderColor: colors.primarySoft,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    marginVertical: spacing.xl,
  },
  codigo: { fontFamily: fontFamily.bold, fontSize: 26, color: colors.primaryDark, letterSpacing: 1.5 },
  copiar: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
