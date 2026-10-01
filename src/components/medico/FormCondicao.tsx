import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Expansivel } from '@/src/components/anim/Expansivel';
import { useTremor } from '@/src/components/anim/useTremor';
import { Alerta } from '@/src/components/ui/Alerta';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Opcoes } from '@/src/components/ui/Opcoes';
import { atualizarCondicao, registarCondicao } from '@/src/services/condicao.service';
import { paraErroApi } from '@/src/services/api';
import {
  condutaPorOmissao,
  INFO_CONDUTA,
  OPCOES_CONDUTA,
  OPCOES_ESTADO_CONDICAO,
  OPCOES_MECANISMO,
} from '@/src/utils/clinico';
import { dataParaApi, formatarData } from '@/src/utils/datas';
import type {
  CondicaoMedica,
  CondutaAlergia,
  DadosCondicao,
  EstadoCondicao,
  MecanismoAlergia,
} from '@/src/types';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

const dataOpcional = z
  .string()
  .refine((v) => !v.trim() || dataParaApi(v) !== null, 'Use o formato dd/mm/aaaa');

const schema = z
  .object({
    tipo: z.enum(['ALERGIA', 'DOENCA_CRONICA'], { message: 'Escolha o tipo' }),
    descricao: z.string().trim().min(2, 'Descreva a condição'),
    severidade: z.enum(['BAIXA', 'MEDIA', 'CRITICA'], { message: 'Escolha a severidade' }),
    estado: z.enum(['ATIVA', 'EM_REMISSAO', 'INATIVA', 'RESOLVIDA']),
    codigoCid: z
      .string()
      .trim()
      .refine((v) => !v || /^[A-Z0-9]{2,4}(\.[A-Z0-9]{1,4})?$/i.test(v), 'CID inválido (ex.: E11, J45.9)'),
    dataInicio: dataOpcional,
    dataFim: dataOpcional,
    observacoes: z.string().max(2000, 'Máximo 2000 caracteres'),
    agente: z.string().trim(),
    classeFarmacologica: z.string().trim(),
    mecanismo: z.string().nullable(),
    reacaoObservada: z.string().trim(),
    conduta: z.string().nullable(),
  })
  .refine(
    (d) => {
      const ini = dataParaApi(d.dataInicio);
      const fim = dataParaApi(d.dataFim);
      return !ini || !fim || fim >= ini;
    },
    { message: 'A data de fim não pode ser antes do início', path: ['dataFim'] }
  );

type Form = z.infer<typeof schema>;

interface Props {
  pacienteId: string;
  inicial?: CondicaoMedica;
  aoGuardar: (condicao: CondicaoMedica) => void;
}

const vazioSeNull = (v?: string | null) => v ?? '';
const textoOuUndefined = (v: string) => v.trim() || undefined;

function Secao({ titulo }: { titulo: string }) {
  return <Text style={styles.secao}>{titulo}</Text>;
}

export function FormCondicao({ pacienteId, inicial, aoGuardar }: Props) {
  const [erro, setErro] = useState<string | null>(null);
  const { estilo, tremer } = useTremor();

  const { control, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: inicial?.tipo ?? 'ALERGIA',
      descricao: inicial?.descricao ?? '',
      severidade: inicial?.severidade ?? 'MEDIA',
      estado: inicial?.estado ?? 'ATIVA',
      codigoCid: vazioSeNull(inicial?.codigoCid),
      dataInicio: inicial?.dataInicio ? formatarData(inicial.dataInicio) : '',
      dataFim: inicial?.dataFim ? formatarData(inicial.dataFim) : '',
      observacoes: vazioSeNull(inicial?.observacoes),
      agente: vazioSeNull(inicial?.agente),
      classeFarmacologica: vazioSeNull(inicial?.classeFarmacologica),
      mecanismo: inicial?.mecanismo ?? null,
      reacaoObservada: vazioSeNull(inicial?.reacaoObservada),
      conduta: inicial?.conduta ?? null,
    },
  });

  const alergia = useWatch({ control, name: 'tipo' }) === 'ALERGIA';
  const severidade = useWatch({ control, name: 'severidade' });
  const conduta = useWatch({ control, name: 'conduta' }) as CondutaAlergia | null;

  const guardar = handleSubmit(
    async (d) => {
      setErro(null);
      const corpo: DadosCondicao = {
        tipo: d.tipo,
        descricao: d.descricao.trim(),
        severidade: d.severidade,
        estado: d.estado,
        codigoCid: textoOuUndefined(d.codigoCid)?.toUpperCase(),
        dataInicio: dataParaApi(d.dataInicio) ?? undefined,
        dataFim: dataParaApi(d.dataFim) ?? undefined,
        observacoes: textoOuUndefined(d.observacoes),
      };
      // Campos de alergia noutro tipo dão 400
      if (d.tipo === 'ALERGIA') {
        corpo.agente = textoOuUndefined(d.agente);
        corpo.classeFarmacologica = textoOuUndefined(d.classeFarmacologica);
        corpo.mecanismo = (d.mecanismo as MecanismoAlergia | null) ?? undefined;
        corpo.reacaoObservada = textoOuUndefined(d.reacaoObservada);
        corpo.conduta = (d.conduta as CondutaAlergia | null) ?? undefined;
      }
      try {
        const resultado = inicial
          ? await atualizarCondicao(inicial.id, corpo)
          : await registarCondicao(pacienteId, corpo);
        aoGuardar(resultado);
      } catch (e) {
        const err = paraErroApi(e);
        setErro([err.message, ...err.detalhes].join('\n'));
        tremer();
      }
    },
    () => tremer()
  );

  return (
    <Animated.View style={estilo}>
      <Controller
        control={control}
        name="tipo"
        render={({ field, fieldState }) => (
          <Opcoes
            label="Tipo"
            opcoes={[
              { valor: 'ALERGIA', titulo: 'Alergia' },
              { valor: 'DOENCA_CRONICA', titulo: 'Doença crónica' },
            ]}
            valor={field.value}
            onMudar={(v) => v && field.onChange(v)}
            erro={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="descricao"
        render={({ field, fieldState }) => (
          <Input
            label="Descrição"
            placeholder={alergia ? 'Ex.: Alergia a Amoxicilina' : 'Ex.: Diabetes Mellitus tipo 2'}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            erro={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="severidade"
        render={({ field, fieldState }) => (
          <Opcoes
            label={alergia ? 'Gravidade' : 'Severidade'}
            opcoes={[
              { valor: 'BAIXA', titulo: alergia ? 'Leve' : 'Baixa' },
              { valor: 'MEDIA', titulo: alergia ? 'Moderada' : 'Média' },
              { valor: 'CRITICA', titulo: alergia ? 'Grave' : 'Crítica' },
            ]}
            valor={field.value}
            onMudar={(v) => v && field.onChange(v)}
            erro={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="estado"
        render={({ field }) => (
          <Opcoes<EstadoCondicao>
            label="Estado"
            opcoes={OPCOES_ESTADO_CONDICAO}
            valor={field.value}
            onMudar={(v) => v && field.onChange(v)}
          />
        )}
      />

      {alergia ? (
        <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOut.duration(150)} layout={LinearTransition} style={styles.caixaAlergia}>
          <Secao titulo="Dados da alergia" />
          <Controller
            control={control}
            name="agente"
            render={({ field }) => (
              <Input label="Agente / substância" placeholder="Ex.: Amoxicilina" value={field.value} onChangeText={field.onChange} />
            )}
          />
          <Controller
            control={control}
            name="classeFarmacologica"
            render={({ field }) => (
              <Input
                label="Classe farmacológica"
                placeholder="Ex.: Beta-lactâmicos"
                ajuda="Usada para alertar reatividade cruzada nas prescrições."
                value={field.value}
                onChangeText={field.onChange}
              />
            )}
          />
          <Controller
            control={control}
            name="reacaoObservada"
            render={({ field }) => (
              <Input label="Reação observada" placeholder="Ex.: Broncoespasmo" value={field.value} onChangeText={field.onChange} />
            )}
          />
          <Controller
            control={control}
            name="mecanismo"
            render={({ field }) => (
              <Opcoes<MecanismoAlergia>
                label="Mecanismo"
                limpavel
                opcoes={OPCOES_MECANISMO}
                valor={field.value as MecanismoAlergia | null}
                onMudar={field.onChange}
              />
            )}
          />
          <Controller
            control={control}
            name="conduta"
            render={({ field }) => (
              <Opcoes<CondutaAlergia>
                label="Conduta"
                limpavel
                opcoes={OPCOES_CONDUTA}
                valor={field.value as CondutaAlergia | null}
                onMudar={field.onChange}
              />
            )}
          />
          {!conduta ? (
            <Text style={styles.ajuda}>
              Sem conduta indicada, fica &quot;{INFO_CONDUTA[condutaPorOmissao(severidade)].label}&quot; pela
              gravidade.
            </Text>
          ) : null}
        </Animated.View>
      ) : null}

      <Animated.View layout={LinearTransition} style={styles.caixa}>
        <Expansivel titulo="Mais detalhes clínicos" subtitulo="CID, datas e observações">
          <View style={{ paddingTop: spacing.sm }}>
            <Controller
              control={control}
              name="codigoCid"
              render={({ field, fieldState }) => (
                <Input
                  label="Código CID-10/11"
                  placeholder="Ex.: E11, I10, J45.9"
                  autoCapitalize="characters"
                  value={field.value}
                  onChangeText={field.onChange}
                  erro={fieldState.error?.message}
                />
              )}
            />
            <View style={styles.duasColunas}>
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="dataInicio"
                  render={({ field, fieldState }) => (
                    <Input
                      label="Início"
                      placeholder="dd/mm/aaaa"
                      keyboardType="numbers-and-punctuation"
                      value={field.value}
                      onChangeText={field.onChange}
                      erro={fieldState.error?.message}
                    />
                  )}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Controller
                  control={control}
                  name="dataFim"
                  render={({ field, fieldState }) => (
                    <Input
                      label="Fim (resolvida)"
                      placeholder="dd/mm/aaaa"
                      keyboardType="numbers-and-punctuation"
                      value={field.value}
                      onChangeText={field.onChange}
                      erro={fieldState.error?.message}
                    />
                  )}
                />
              </View>
            </View>
            <Controller
              control={control}
              name="observacoes"
              render={({ field, fieldState }) => (
                <Input
                  label="Observações"
                  placeholder="Ex.: Em acompanhamento na endocrinologia"
                  multiline
                  value={field.value}
                  onChangeText={field.onChange}
                  erro={fieldState.error?.message}
                />
              )}
            />
          </View>
        </Expansivel>
      </Animated.View>

      <Animated.View layout={LinearTransition}>
        <Alerta mensagem={erro} />
        <Button
          titulo={inicial ? 'Guardar alterações' : 'Registar'}
          icone="content-save-outline"
          onPress={guardar}
          carregando={formState.isSubmitting}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  secao: {
    fontFamily: fontFamily.semibold,
    fontSize: 14,
    color: colors.primaryDark,
    marginBottom: spacing.md,
  },
  caixaAlergia: {
    borderWidth: 1,
    borderColor: colors.errorSoft,
    backgroundColor: '#FFFBFB',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  caixa: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  duasColunas: { flexDirection: 'row', gap: spacing.sm },
  ajuda: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: -spacing.sm,
  },
});
