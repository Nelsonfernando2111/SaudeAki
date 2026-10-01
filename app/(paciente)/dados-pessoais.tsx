import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated from 'react-native-reanimated';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useTremor } from '@/src/components/anim/useTremor';
import { Skeleton } from '@/src/components/anim/Skeleton';
import { Alerta } from '@/src/components/ui/Alerta';
import { Button } from '@/src/components/ui/Button';
import { Cabecalho } from '@/src/components/ui/Cabecalho';
import { Input } from '@/src/components/ui/Input';
import { Opcoes } from '@/src/components/ui/Opcoes';
import { paraErroApi } from '@/src/services/api';
import { atualizarMeuPerfil, obterMeuPerfil } from '@/src/services/paciente.service';
import { useSessaoStore } from '@/src/store/sessao.store';
import { toast } from '@/src/store/toast.store';
import { dataParaApi, formatarData } from '@/src/utils/datas';
import type { AtualizacaoPaciente, FatorRh, GrupoSanguineo, Paciente } from '@/src/types';
import { colors, spacing } from '@/src/theme';

const schema = z.object({
  nomeCompleto: z.string().trim().min(3, 'Informe o nome completo'),
  telefone: z
    .string()
    .transform((v) => v.replace(/\s/g, ''))
    .refine((v) => /^\+?\d{9,}$/.test(v), 'Telefone inválido'),
  dataNascimento: z
    .string()
    .refine((v) => !v.trim() || dataParaApi(v) !== null, 'Use o formato dd/mm/aaaa'),
  genero: z.string().nullable(),
  cidade: z.string(),
  contactoEmergencia: z.string(),
  grupoSanguineo: z.enum(['A', 'B', 'AB', 'O']).nullable(),
  fatorRh: z.enum(['POSITIVO', 'NEGATIVO']).nullable(),
});

type Entrada = z.input<typeof schema>;
type Saida = z.output<typeof schema>;

function valoresDe(p: Paciente | null): Entrada {
  return {
    nomeCompleto: p?.nomeCompleto ?? '',
    telefone: p?.telefone ?? '',
    dataNascimento: p?.dataNascimento ? formatarData(p.dataNascimento) : '',
    genero: p?.genero ?? null,
    cidade: p?.cidade ?? '',
    contactoEmergencia: p?.contactoEmergencia ?? '',
    grupoSanguineo: p?.grupoSanguineo ?? null,
    fatorRh: p?.fatorRh ?? null,
  };
}

export default function DadosPessoais() {
  const router = useRouter();
  const paciente = useSessaoStore((s) => s.paciente);
  const definirPaciente = useSessaoStore((s) => s.definirPaciente);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(!paciente);
  const { estilo, tremer } = useTremor();

  const { control, handleSubmit, formState, reset } = useForm<Entrada, unknown, Saida>({
    resolver: zodResolver(schema),
    defaultValues: valoresDe(paciente),
  });

  // Garante dados frescos do servidor
  useEffect(() => {
    obterMeuPerfil()
      .then((p) => {
        definirPaciente(p);
        reset(valoresDe(p));
      })
      .catch(() => {})
      .finally(() => setCarregando(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const guardar = handleSubmit(
    async (d) => {
      setErro(null);
      // Atualização parcial: campos vazios não são enviados
      const corpo: AtualizacaoPaciente = {
        nomeCompleto: d.nomeCompleto.trim(),
        telefone: d.telefone,
        dataNascimento: dataParaApi(d.dataNascimento) ?? undefined,
        genero: d.genero ?? undefined,
        cidade: d.cidade.trim() || undefined,
        contactoEmergencia: d.contactoEmergencia.replace(/\s/g, '') || undefined,
        grupoSanguineo: d.grupoSanguineo ?? undefined,
        fatorRh: d.fatorRh ?? undefined,
      };
      try {
        definirPaciente(await atualizarMeuPerfil(corpo));
        toast.sucesso('Dados atualizados');
        router.back();
      } catch (e) {
        const err = paraErroApi(e);
        setErro(err.status === 409 ? 'Este telefone já está a ser usado por outra conta.' : err.message);
        tremer();
      }
    },
    () => tremer()
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Cabecalho titulo="Dados pessoais" voltar />

      {carregando ? (
        <View style={styles.scroll}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={{ marginBottom: spacing.lg, gap: 8 }}>
              <Skeleton largura="30%" altura={12} />
              <Skeleton altura={50} raio={12} />
            </View>
          ))}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Animated.View style={estilo}>
            <Alerta mensagem={erro} />

            <Input label="Código único" value={paciente?.codUnico ?? ''} editable={false} icone="card-account-details-outline" />

            <Controller
              control={control}
              name="nomeCompleto"
              render={({ field, fieldState }) => (
                <Input label="Nome completo" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} erro={fieldState.error?.message} />
              )}
            />
            <Controller
              control={control}
              name="telefone"
              render={({ field, fieldState }) => (
                <Input label="Telefone" keyboardType="phone-pad" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} erro={fieldState.error?.message} />
              )}
            />
            <Controller
              control={control}
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
              control={control}
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
              control={control}
              name="cidade"
              render={({ field }) => <Input label="Cidade" value={field.value} onChangeText={field.onChange} />}
            />
            <Controller
              control={control}
              name="contactoEmergencia"
              render={({ field }) => (
                <Input label="Contacto de emergência" keyboardType="phone-pad" value={field.value} onChangeText={field.onChange} />
              )}
            />
            <Controller
              control={control}
              name="grupoSanguineo"
              render={({ field }) => (
                <Opcoes<GrupoSanguineo>
                  label="Grupo sanguíneo"
                  opcoes={(['A', 'B', 'AB', 'O'] as const).map((g) => ({ valor: g, titulo: g }))}
                  valor={field.value}
                  onMudar={field.onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="fatorRh"
              render={({ field }) => (
                <Opcoes<FatorRh>
                  label="Fator Rh"
                  opcoes={[
                    { valor: 'POSITIVO', titulo: 'Positivo (+)' },
                    { valor: 'NEGATIVO', titulo: 'Negativo (−)' },
                  ]}
                  valor={field.value}
                  onMudar={field.onChange}
                />
              )}
            />
          </Animated.View>

          <Button titulo="Guardar" icone="content-save-outline" onPress={guardar} carregando={formState.isSubmitting} />
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl },
});
