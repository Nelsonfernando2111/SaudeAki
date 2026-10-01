import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useVoltar } from '@/src/hooks/useVoltar';
import Animated from 'react-native-reanimated';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useTremor } from '@/src/components/anim/useTremor';
import { Skeleton } from '@/src/components/anim/Skeleton';
import { Alerta } from '@/src/components/ui/Alerta';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Opcoes } from '@/src/components/ui/Opcoes';
import { paraErroApi } from '@/src/services/api';
import { atualizarMeuPerfil, obterMeuPerfil } from '@/src/services/paciente.service';
import { useSessaoStore } from '@/src/store/sessao.store';
import { toast } from '@/src/store/toast.store';
import { dataNoPassado, dataParaApi, formatarData } from '@/src/utils/datas';
import { TIPOS_DOCUMENTO } from '@/src/utils/clinico';
import { CartaoDocumento } from '@/src/components/shared/CartaoDocumento';
import type { AtualizacaoPaciente, FatorRh, GrupoSanguineo, Paciente, TipoDocumento } from '@/src/types';
import { colors, spacing } from '@/src/theme';

const schema = z.object({
  nomeCompleto: z.string().trim().min(3, 'Informe o nome completo'),
  telefone: z
    .string()
    .transform((v) => v.replace(/\s/g, ''))
    .refine((v) => /^\+?\d{9,}$/.test(v), 'Telefone inválido'),
  dataNascimento: z
    .string()
    .min(1, 'Informe a data de nascimento')
    .refine((v) => dataParaApi(v) !== null, 'Use o formato dd/mm/aaaa')
    .refine((v) => dataNoPassado(v), 'A data tem de ser no passado'),
  genero: z.string().nullable().refine((v) => !!v, 'Escolha o sexo'),
  cidade: z.string(),
  contactoEmergencia: z
    .string()
    .transform((v) => v.replace(/\s/g, ''))
    .refine((v) => /^\+?\d{9,}$/.test(v), 'Contacto de emergência inválido'),
  grupoSanguineo: z.enum(['A', 'B', 'AB', 'O']).nullable(),
  fatorRh: z.enum(['POSITIVO', 'NEGATIVO']).nullable(),
  tipoDocumento: z.enum(['BI', 'PASSAPORTE', 'DIRE', 'CARTA_CONDUCAO', 'CARTAO_ELEITOR', 'OUTRO']).nullable(),
  numeroDocumento: z.string(),
})
  // O tipo e o número do documento vêm sempre juntos
  .refine((d) => !d.tipoDocumento || d.numeroDocumento.trim().length > 0, {
    message: 'Informe o número do documento',
    path: ['numeroDocumento'],
  })
  .refine((d) => !!d.tipoDocumento || d.numeroDocumento.trim().length === 0, {
    message: 'Escolha o tipo de documento',
    path: ['tipoDocumento'],
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
    tipoDocumento: p?.tipoDocumento ?? null,
    numeroDocumento: p?.numeroDocumento ?? '',
  };
}

export default function DadosPessoais() {
  const voltar = useVoltar();
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
        contactoEmergencia: d.contactoEmergencia,
        grupoSanguineo: d.grupoSanguineo ?? undefined,
        fatorRh: d.fatorRh ?? undefined,
        tipoDocumento: d.tipoDocumento ?? undefined,
        numeroDocumento: d.numeroDocumento.trim().toUpperCase() || undefined,
      };
      try {
        definirPaciente(await atualizarMeuPerfil(corpo));
        toast.sucesso('Dados atualizados');
        voltar();
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
              render={({ field, fieldState }) => (
                <Opcoes
                  label="Sexo"
                  opcoes={[
                    { valor: 'F', titulo: 'Feminino' },
                    { valor: 'M', titulo: 'Masculino' },
                  ]}
                  valor={field.value}
                  onMudar={field.onChange}
                  erro={fieldState.error?.message}
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
              render={({ field, fieldState }) => (
                <Input
                  label="Contacto de emergência"
                  keyboardType="phone-pad"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  erro={fieldState.error?.message}
                />
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
            <Controller
              control={control}
              name="tipoDocumento"
              render={({ field, fieldState }) => (
                <Opcoes<TipoDocumento>
                  label="Tipo de documento de identidade"
                  limpavel
                  opcoes={TIPOS_DOCUMENTO}
                  valor={field.value}
                  onMudar={field.onChange}
                  erro={fieldState.error?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="numeroDocumento"
              render={({ field, fieldState }) => (
                <Input
                  label="Número do documento"
                  autoCapitalize="characters"
                  value={field.value}
                  onChangeText={field.onChange}
                  erro={fieldState.error?.message}
                />
              )}
            />
          </Animated.View>

          <Button titulo="Guardar" icone="content-save-outline" onPress={guardar} carregando={formState.isSubmitting} />

          <View style={styles.documento}>
            <CartaoDocumento
              tipo={paciente?.tipoDocumento}
              numero={paciente?.numeroDocumento}
              temFicheiro={!!paciente?.documentoIdentidadeUrl}
              aoAtualizar={(p) => {
                if (p) definirPaciente(p);
                else if (paciente) definirPaciente({ ...paciente, documentoIdentidadeUrl: null });
              }}
            />
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl },
  documento: { marginTop: spacing.xl },
});
