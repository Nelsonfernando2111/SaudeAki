import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Tocavel } from '@/src/components/anim/Tocavel';
import { useTremor } from '@/src/components/anim/useTremor';
import { Alerta } from '@/src/components/ui/Alerta';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { Opcoes } from '@/src/components/ui/Opcoes';
import { atualizarExame, registarExame } from '@/src/services/exame.service';
import { paraErroApi } from '@/src/services/api';
import { agoraLocalApi } from '@/src/utils/datas';
import { statusExame } from '@/src/utils/clinico';
import type { DadosExame, Exame } from '@/src/types';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

const schema = z.object({
  tipoExame: z.string().trim().min(2, 'Informe o tipo de exame'),
  realizado: z.enum(['NAO', 'SIM']),
  resultados: z.array(
    z.object({
      nomeParametro: z.string().trim().min(1, 'Obrigatório'),
      valor: z.string().trim().min(1, 'Obrigatório'),
      unidadeMedida: z.string().trim(),
      valorReferencia: z.string().trim(),
    })
  ),
});

type Form = z.infer<typeof schema>;

interface Props {
  pacienteId: string;
  inicial?: Exame;
  aoGuardar: (exame: Exame) => void;
}

const vazio = { nomeParametro: '', valor: '', unidadeMedida: '', valorReferencia: '' };

export function FormExame({ pacienteId, inicial, aoGuardar }: Props) {
  const [erro, setErro] = useState<string | null>(null);
  const { estilo, tremer } = useTremor();
  const jaRealizado = inicial ? statusExame(inicial) === 'REALIZADO' : false;

  const { control, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipoExame: inicial?.tipoExame ?? '',
      realizado: jaRealizado ? 'SIM' : 'NAO',
      resultados:
        inicial?.resultado.map((r) => ({
          nomeParametro: r.nomeParametro,
          valor: r.valor,
          unidadeMedida: r.unidadeMedida ?? '',
          valorReferencia: r.valorReferencia ?? '',
        })) ?? [],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'resultados' });

  const guardar = handleSubmit(
    async (dados) => {
      setErro(null);
      const corpo: DadosExame = {
        tipoExame: dados.tipoExame,
        resultados: dados.resultados.map((r) => ({
          nomeParametro: r.nomeParametro,
          valor: r.valor,
          unidadeMedida: r.unidadeMedida || undefined,
          valorReferencia: r.valorReferencia || undefined,
        })),
      };
      // Marcar como realizado agora (num exame pendente passa a REALIZADO)
      if (dados.realizado === 'SIM' && !jaRealizado) corpo.dataRealizado = agoraLocalApi();
      try {
        const resultado = inicial
          ? await atualizarExame(inicial.id, corpo)
          : await registarExame(pacienteId, corpo);
        aoGuardar(resultado);
      } catch (e) {
        setErro(paraErroApi(e).message);
        tremer();
      }
    },
    () => tremer()
  );

  return (
    <Animated.View style={estilo}>
      <Alerta mensagem={erro} />
      <Controller
        control={control}
        name="tipoExame"
        render={({ field, fieldState }) => (
          <Input
            label="Tipo de exame"
            placeholder="Ex.: Hemograma"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            erro={fieldState.error?.message}
          />
        )}
      />
      {!jaRealizado ? (
        <Controller
          control={control}
          name="realizado"
          render={({ field }) => (
            <Opcoes
              label="Estado"
              opcoes={[
                { valor: 'NAO', titulo: 'Pendente' },
                { valor: 'SIM', titulo: 'Realizado agora' },
              ]}
              valor={field.value}
              onMudar={(v) => v && field.onChange(v)}
            />
          )}
        />
      ) : null}

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
                  <Input placeholder="Referência (12-16)" value={field.value} onChangeText={field.onChange} />
                )}
              />
            </View>
          </View>
        </Animated.View>
      ))}

      <Animated.View layout={LinearTransition}>
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
});
