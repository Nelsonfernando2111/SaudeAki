import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Expansivel } from '@/src/components/anim/Expansivel';
import { Tocavel } from '@/src/components/anim/Tocavel';
import { useTremor } from '@/src/components/anim/useTremor';
import { Alerta } from '@/src/components/ui/Alerta';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Opcoes } from '@/src/components/ui/Opcoes';
import { atualizarExame, registarExame } from '@/src/services/exame.service';
import { paraErroApi } from '@/src/services/api';
import { agoraLocalApi } from '@/src/utils/datas';
import { INFO_CLASSIFICACAO, OPCOES_CATEGORIA_EXAME, statusExame } from '@/src/utils/clinico';
import type { CategoriaExame, ClassificacaoResultado, DadosExame, Exame, StatusExame } from '@/src/types';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

const schema = z.object({
  tipoExame: z.string().trim().min(2, 'Informe o nome do exame'),
  categoria: z.string().nullable(),
  codigo: z.string().trim().max(30, 'Máximo 30 caracteres'),
  indicacaoClinica: z.string().trim(),
  status: z.enum(['PENDENTE', 'EM_ANALISE', 'REALIZADO']),
  resultados: z.array(
    z.object({
      nomeParametro: z.string().trim().min(1, 'Obrigatório'),
      valor: z.string().trim().min(1, 'Obrigatório'),
      unidadeMedida: z.string().trim(),
      valorReferencia: z.string().trim(),
      classificacao: z.string().nullable(),
    })
  ),
  achados: z.string().trim(),
  conclusao: z.string().trim(),
  responsavelLaudoNome: z.string().trim(),
  responsavelLaudoNumeroOrdem: z.string().trim().max(30, 'Máximo 30 caracteres'),
});

type Form = z.infer<typeof schema>;

interface Props {
  pacienteId: string;
  inicial?: Exame;
  aoGuardar: (exame: Exame) => void;
}

const vazio = { nomeParametro: '', valor: '', unidadeMedida: '', valorReferencia: '', classificacao: null };

const OPCOES_STATUS: { valor: Exclude<StatusExame, 'CANCELADO'>; titulo: string }[] = [
  { valor: 'PENDENTE', titulo: 'Solicitado' },
  { valor: 'EM_ANALISE', titulo: 'Em análise' },
  { valor: 'REALIZADO', titulo: 'Concluído' },
];

const OPCOES_CLASSIFICACAO = (Object.keys(INFO_CLASSIFICACAO) as ClassificacaoResultado[]).map((v) => ({
  valor: v,
  titulo: INFO_CLASSIFICACAO[v].label,
}));

const texto = (v?: string | null) => v ?? '';
const ouUndefined = (v: string) => v.trim() || undefined;

export function FormExame({ pacienteId, inicial, aoGuardar }: Props) {
  const [erro, setErro] = useState<string | null>(null);
  const { estilo, tremer } = useTremor();
  const statusInicial = inicial ? statusExame(inicial) : 'PENDENTE';

  const { control, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipoExame: inicial?.tipoExame ?? '',
      categoria: inicial?.categoria ?? null,
      codigo: texto(inicial?.codigo),
      indicacaoClinica: texto(inicial?.indicacaoClinica),
      status: statusInicial === 'CANCELADO' ? 'PENDENTE' : statusInicial,
      resultados:
        inicial?.resultado.map((r) => ({
          nomeParametro: r.nomeParametro,
          valor: r.valor,
          unidadeMedida: texto(r.unidadeMedida),
          valorReferencia: texto(r.valorReferencia),
          classificacao: r.classificacao ?? null,
        })) ?? [],
      achados: texto(inicial?.achados),
      conclusao: texto(inicial?.conclusao),
      responsavelLaudoNome: texto(inicial?.responsavelLaudoNome),
      responsavelLaudoNumeroOrdem: texto(inicial?.responsavelLaudoNumeroOrdem),
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'resultados' });

  const guardar = handleSubmit(
    async (d) => {
      setErro(null);
      const corpo: DadosExame = {
        tipoExame: d.tipoExame,
        categoria: (d.categoria as CategoriaExame | null) ?? undefined,
        codigo: ouUndefined(d.codigo),
        indicacaoClinica: ouUndefined(d.indicacaoClinica),
        status: d.status,
        // Se vier (mesmo []), substitui todos os resultados
        resultados: d.resultados.map((r) => ({
          nomeParametro: r.nomeParametro,
          valor: r.valor,
          unidadeMedida: ouUndefined(r.unidadeMedida),
          valorReferencia: ouUndefined(r.valorReferencia),
          // Sem classificação, o servidor calcula-a pela referência numérica
          classificacao: (r.classificacao as ClassificacaoResultado | null) ?? undefined,
        })),
        achados: ouUndefined(d.achados),
        conclusao: ouUndefined(d.conclusao),
        responsavelLaudoNome: ouUndefined(d.responsavelLaudoNome),
        responsavelLaudoNumeroOrdem: ouUndefined(d.responsavelLaudoNumeroOrdem),
      };
      // Concluído sem data de realização: regista o momento atual
      if (d.status === 'REALIZADO' && !inicial?.dataRealizado) corpo.dataRealizado = agoraLocalApi();
      try {
        const resultado = inicial
          ? await atualizarExame(inicial.id, corpo)
          : await registarExame(pacienteId, corpo);
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
        name="tipoExame"
        render={({ field, fieldState }) => (
          <Input
            label="Exame"
            placeholder="Ex.: Hemograma Completo"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            erro={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="categoria"
        render={({ field }) => (
          <Opcoes<CategoriaExame>
            label="Categoria"
            limpavel
            opcoes={OPCOES_CATEGORIA_EXAME}
            valor={field.value as CategoriaExame | null}
            onMudar={field.onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="indicacaoClinica"
        render={({ field }) => (
          <Input
            label="Indicação clínica"
            placeholder="Ex.: Investigação de anemia"
            multiline
            value={field.value}
            onChangeText={field.onChange}
          />
        )}
      />
      <Controller
        control={control}
        name="codigo"
        render={({ field, fieldState }) => (
          <Input
            label="Código (opcional)"
            placeholder="LOINC, TUSS ou interno — ex.: 58410-2"
            autoCapitalize="characters"
            value={field.value}
            onChangeText={field.onChange}
            erro={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="status"
        render={({ field }) => (
          <Opcoes
            label="Estado"
            opcoes={OPCOES_STATUS}
            valor={field.value}
            onMudar={(v) => v && field.onChange(v)}
          />
        )}
      />

      <View style={styles.resultadosTopo}>
        <Text style={styles.label}>Resultados</Text>
        <Tocavel onPress={() => append(vazio)} style={styles.adicionar} escala={0.95}>
          <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
          <Text style={styles.adicionarTexto}>Parâmetro</Text>
        </Tocavel>
      </View>

      {fields.length === 0 ? (
        <Text style={styles.semResultados}>Sem resultados. Pode lançá-los mais tarde.</Text>
      ) : null}

      {fields.map((f, i) => (
        <Animated.View
          key={f.id}
          entering={FadeInDown.duration(220)}
          exiting={FadeOut.duration(150)}
          layout={LinearTransition}
          style={styles.parametro}
        >
          <View style={styles.parametroTopo}>
            <Text style={styles.parametroTitulo}>Parâmetro {i + 1}</Text>
            <Tocavel onPress={() => remove(i)} style={styles.remover} escala={0.9} accessibilityLabel="Remover">
              <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
            </Tocavel>
          </View>
          <View style={styles.duasColunas}>
            <View style={{ flex: 1.4 }}>
              <Controller
                control={control}
                name={`resultados.${i}.nomeParametro`}
                render={({ field, fieldState }) => (
                  <Input placeholder="Nome (ex.: Hemoglobina)" value={field.value} onChangeText={field.onChange} erro={fieldState.error?.message} />
                )}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name={`resultados.${i}.valor`}
                render={({ field, fieldState }) => (
                  <Input placeholder="Valor" value={field.value} onChangeText={field.onChange} erro={fieldState.error?.message} />
                )}
              />
            </View>
          </View>
          <View style={styles.duasColunas}>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name={`resultados.${i}.unidadeMedida`}
                render={({ field }) => (
                  <Input placeholder="Unidade (g/dL)" value={field.value} onChangeText={field.onChange} />
                )}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name={`resultados.${i}.valorReferencia`}
                render={({ field }) => (
                  <Input placeholder="Referência (12.0 - 16.0)" value={field.value} onChangeText={field.onChange} />
                )}
              />
            </View>
          </View>
          <Controller
            control={control}
            name={`resultados.${i}.classificacao`}
            render={({ field }) => (
              <Opcoes<ClassificacaoResultado>
                limpavel
                opcoes={OPCOES_CLASSIFICACAO}
                valor={field.value as ClassificacaoResultado | null}
                onMudar={field.onChange}
              />
            )}
          />
        </Animated.View>
      ))}
      {fields.length > 0 ? (
        <Text style={styles.ajuda}>
          Sem classificação, é calculada pela referência numérica (Baixo / Normal / Alto).
        </Text>
      ) : null}

      <Animated.View layout={LinearTransition} style={styles.caixa}>
        <Expansivel titulo="Laudo" subtitulo="Achados, conclusão e responsável">
          <View style={{ paddingTop: spacing.sm }}>
            <Controller
              control={control}
              name="achados"
              render={({ field }) => (
                <Input label="Achados" placeholder="Laudo narrativo (imagem, biópsia…)" multiline value={field.value} onChangeText={field.onChange} />
              )}
            />
            <Controller
              control={control}
              name="conclusao"
              render={({ field }) => (
                <Input label="Conclusão" placeholder="Impressão diagnóstica" multiline value={field.value} onChangeText={field.onChange} />
              )}
            />
            <Controller
              control={control}
              name="responsavelLaudoNome"
              render={({ field }) => (
                <Input label="Responsável pelo laudo" placeholder="Ex.: Dra. Fátima Mussa" value={field.value} onChangeText={field.onChange} />
              )}
            />
            <Controller
              control={control}
              name="responsavelLaudoNumeroOrdem"
              render={({ field, fieldState }) => (
                <Input
                  label="Nº da Ordem do responsável"
                  placeholder="Ex.: OM-12345"
                  autoCapitalize="characters"
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
          titulo={inicial ? 'Guardar alterações' : 'Registar exame'}
          icone="flask-outline"
          onPress={guardar}
          carregando={formState.isSubmitting}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  label: { fontFamily: fontFamily.medium, fontSize: 14, color: colors.text },
  resultadosTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  adicionar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primaryFaint,
  },
  adicionarTexto: { fontFamily: fontFamily.semibold, fontSize: 13, color: colors.primary },
  semResultados: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  parametro: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    paddingBottom: 0,
    marginBottom: spacing.md,
    backgroundColor: colors.background,
  },
  parametroTopo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  parametroTitulo: { fontFamily: fontFamily.semibold, fontSize: 13, color: colors.textSecondary },
  remover: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  duasColunas: { flexDirection: 'row', gap: spacing.sm },
  ajuda: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  caixa: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
});
