import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { IconeRotativo } from '@/src/components/anim/IconeRotativo';
import { Tocavel } from '@/src/components/anim/Tocavel';
import { useTremor } from '@/src/components/anim/useTremor';
import { Alerta } from '@/src/components/ui/Alerta';
import { Button } from '@/src/components/ui/Button';
import { Etiqueta } from '@/src/components/ui/Etiqueta';
import { Input } from '@/src/components/ui/Input';
import { paraErroApi } from '@/src/services/api';
import {
  atualizarPrescricao,
  eAlertaAlergia,
  registarPrescricao,
  verificarAlergias,
} from '@/src/services/prescricao.service';
import { INFO_CONDUTA, NOMES_MECANISMO } from '@/src/utils/clinico';
import type { AlertaAlergia, DadosPrescricao, Prescricao } from '@/src/types';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

const schema = z.object({
  nomeMedicamento: z.string().trim().min(2, 'Informe o medicamento'),
  classeFarmacologica: z.string().trim(),
  dosagem: z.string().trim(),
  frequencia: z.string().trim(),
  duracao: z.string().trim(),
});

type Form = z.infer<typeof schema>;

interface Props {
  pacienteId: string;
  inicial?: Prescricao;
  aoGuardar: (prescricao: Prescricao) => void;
}

const CAMPOS: { nome: Exclude<keyof Form, 'nomeMedicamento' | 'classeFarmacologica'>; label: string; placeholder: string }[] = [
  { nome: 'dosagem', label: 'Dosagem', placeholder: 'Ex.: 5mg' },
  { nome: 'frequencia', label: 'Frequência', placeholder: 'Ex.: 1x ao dia' },
  { nome: 'duracao', label: 'Duração', placeholder: 'Ex.: 30 dias' },
];

const ESPERA_VERIFICACAO_MS = 600;

/** Um conflito medicamento × alergia */
function CartaoAlerta({ a }: { a: AlertaAlergia }) {
  const info = INFO_CONDUTA[a.conduta];
  return (
    <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOut} style={styles.alerta}>
      <View style={styles.alertaTopo}>
        <MaterialCommunityIcons name="alert-octagon-outline" size={18} color={colors.error} />
        <Text style={styles.alertaTitulo}>Alergia a {a.alergia}</Text>
        <Etiqueta texto={info.label} cor={info.cor} fundo={info.fundo} />
      </View>
      <Text style={styles.alertaTexto}>
        {a.motivo === 'MESMO_AGENTE' ? 'Mesmo agente' : `Mesma classe${a.classeFarmacologica ? ` (${a.classeFarmacologica})` : ''}`}
        {a.reacaoObservada ? ` · reação: ${a.reacaoObservada}` : ''}
        {a.mecanismo ? ` · ${NOMES_MECANISMO[a.mecanismo]}` : ''}
      </Text>
    </Animated.View>
  );
}

export function FormPrescricao({ pacienteId, inicial, aoGuardar }: Props) {
  const [erro, setErro] = useState<string | null>(null);
  const [alertas, setAlertas] = useState<AlertaAlergia[]>([]);
  const [aVerificar, setAVerificar] = useState(false);
  const [confirmado, setConfirmado] = useState(false);
  /** O servidor recusou com conduta EVITAR: pode reenviar com confirmação */
  const [pedeConfirmacao, setPedeConfirmacao] = useState(false);
  const { estilo, tremer } = useTremor();

  const { control, handleSubmit, formState } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      nomeMedicamento: inicial?.nomeMedicamento ?? '',
      classeFarmacologica: inicial?.classeFarmacologica ?? '',
      dosagem: inicial?.dosagem ?? '',
      frequencia: inicial?.frequencia ?? '',
      duracao: inicial?.duracao ?? '',
    },
  });

  const nome = useWatch({ control, name: 'nomeMedicamento' }).trim();
  const classe = useWatch({ control, name: 'classeFarmacologica' }).trim();

  // Verifica alergias enquanto o médico escreve (com atraso para não pedir a cada tecla)
  useEffect(() => {
    if (nome.length < 3) return;
    let ativo = true;
    const t = setTimeout(async () => {
      setAVerificar(true);
      try {
        const lista = await verificarAlergias(pacienteId, nome, classe || undefined);
        if (ativo) setAlertas(lista);
      } catch {
        // A verificação é uma ajuda: o servidor volta a verificar ao gravar
      } finally {
        if (ativo) setAVerificar(false);
      }
    }, ESPERA_VERIFICACAO_MS);
    return () => {
      ativo = false;
      clearTimeout(t);
    };
  }, [nome, classe, pacienteId]);

  const visiveis = nome.length >= 3 ? alertas : [];
  const bloqueado = visiveis.some((a) => a.conduta === 'BLOQUEIO_ABSOLUTO');
  const precisaConfirmar = !bloqueado && (pedeConfirmacao || visiveis.some((a) => a.conduta === 'EVITAR'));

  const guardar = handleSubmit(
    async (dados) => {
      setErro(null);
      // Campos vazios não são enviados (ficam como estavam)
      const corpo: DadosPrescricao = Object.fromEntries(
        Object.entries(dados).filter(([, v]) => v.length > 0)
      );
      if (precisaConfirmar && confirmado) corpo.confirmarAlertaAlergia = true;
      try {
        const resultado = inicial
          ? await atualizarPrescricao(inicial.id, corpo)
          : await registarPrescricao(pacienteId, { nomeMedicamento: dados.nomeMedicamento, ...corpo });
        aoGuardar(resultado);
      } catch (e) {
        const err = paraErroApi(e);
        if (eAlertaAlergia(err) && !/bloquead/i.test(err.message)) setPedeConfirmacao(true);
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
        name="nomeMedicamento"
        render={({ field, fieldState }) => (
          <Input
            label="Medicamento"
            placeholder="Ex.: Amlodipina"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            erro={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="classeFarmacologica"
        render={({ field }) => (
          <Input
            label="Classe farmacológica (opcional)"
            placeholder="Ex.: Beta-lactâmicos"
            ajuda="Permite detetar alergias da mesma classe."
            value={field.value}
            onChangeText={field.onChange}
          />
        )}
      />

      {/* Alertas de alergia */}
      <Animated.View layout={LinearTransition}>
        {aVerificar ? (
          <View style={styles.verificar}>
            <IconeRotativo tamanho={16} />
            <Text style={styles.verificarTexto}>A verificar alergias do paciente…</Text>
          </View>
        ) : nome.length >= 3 && visiveis.length === 0 ? (
          <View style={styles.semConflito}>
            <MaterialCommunityIcons name="shield-check-outline" size={16} color={colors.success} />
            <Text style={styles.semConflitoTexto}>Sem alergias conhecidas a este medicamento.</Text>
          </View>
        ) : null}
        {visiveis.map((a) => (
          <CartaoAlerta key={a.condicaoId} a={a} />
        ))}
        {bloqueado ? (
          <Text style={styles.bloqueio}>
            Prescrição bloqueada: o paciente tem uma alergia grave a este medicamento ou à sua classe.
          </Text>
        ) : null}
        {precisaConfirmar ? (
          <Tocavel
            onPress={() => setConfirmado((c) => !c)}
            style={[styles.confirmar, confirmado && styles.confirmarAtivo]}
            escala={0.98}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: confirmado }}
          >
            <MaterialCommunityIcons
              name={confirmado ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={22}
              color={confirmado ? colors.error : colors.textSecondary}
            />
            <Text style={styles.confirmarTexto}>
              Estou ciente do alerta e quero prescrever mesmo assim.
            </Text>
          </Tocavel>
        ) : null}
      </Animated.View>

      <Animated.View layout={LinearTransition}>
        {CAMPOS.map((c) => (
          <Controller
            key={c.nome}
            control={control}
            name={c.nome}
            render={({ field }) => (
              <Input label={c.label} placeholder={c.placeholder} value={field.value} onChangeText={field.onChange} />
            )}
          />
        ))}
        <Alerta mensagem={erro} />
        <Button
          titulo={inicial ? 'Guardar alterações' : 'Prescrever'}
          icone="pill"
          onPress={guardar}
          carregando={formState.isSubmitting}
          desativado={bloqueado || (precisaConfirmar && !confirmado)}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  verificar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  verificarTexto: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textSecondary },
  semConflito: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  semConflitoTexto: { fontFamily: fontFamily.medium, fontSize: 12, color: colors.success },
  alerta: {
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: colors.errorSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: 4,
  },
  alertaTopo: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  alertaTitulo: { flex: 1, fontFamily: fontFamily.semibold, fontSize: 14, color: colors.error },
  alertaTexto: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.text, lineHeight: 17 },
  bloqueio: {
    fontFamily: fontFamily.semibold,
    fontSize: 13,
    color: colors.error,
    marginBottom: spacing.md,
  },
  confirmar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  confirmarAtivo: { borderColor: colors.error, backgroundColor: '#FFFBFB' },
  confirmarTexto: { flex: 1, fontFamily: fontFamily.medium, fontSize: 13, color: colors.text },
});
