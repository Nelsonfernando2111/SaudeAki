import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FormAnexo } from '@/src/components/medico/FormAnexo';
import { FormCondicao } from '@/src/components/medico/FormCondicao';
import { FormExame } from '@/src/components/medico/FormExame';
import { FormPrescricao } from '@/src/components/medico/FormPrescricao';
import { Estado } from '@/src/components/ui/Estado';
import { useVoltar } from '@/src/hooks/useVoltar';
import { toast } from '@/src/store/toast.store';
import { comCabecalho } from '@/src/utils/navegacao';
import type { CondicaoMedica, Exame, Prescricao } from '@/src/types';
import { colors, fontFamily, spacing } from '@/src/theme';

type Tipo = 'condicao' | 'prescricao' | 'exame' | 'anexo';

type Params = {
  tipo: Tipo;
  /** UUID ou código do paciente (novos registos) */
  pacienteId?: string;
  /** Exame a que se anexa um ficheiro */
  exameId?: string;
  /** Nome do paciente, só para mostrar */
  pacienteNome?: string;
  /** Registo a editar, em JSON */
  dados?: string;
};

function lerJson<T>(texto?: string): T | undefined {
  if (!texto) return undefined;
  try {
    return JSON.parse(texto) as T;
  } catch {
    return undefined;
  }
}

/**
 * Formulário de registo clínico do médico, aberto como ecrã próprio
 * (condição/alergia, prescrição, exame ou anexo de exame).
 * Ao guardar volta ao ecrã anterior, que recarrega ao ganhar foco.
 */
export default function FormularioClinico() {
  const insets = useSafeAreaInsets();
  const voltar = useVoltar();
  const { tipo, pacienteId, exameId, pacienteNome, dados } = useLocalSearchParams() as Params;

  function concluido(mensagem: string) {
    toast.sucesso(mensagem);
    voltar();
  }

  let titulo = 'Registo';
  let conteudo: React.ReactNode = null;

  if (tipo === 'condicao' && pacienteId) {
    const inicial = lerJson<CondicaoMedica>(dados);
    titulo = inicial ? 'Editar condição' : 'Nova condição ou alergia';
    conteudo = (
      <FormCondicao
        pacienteId={pacienteId}
        inicial={inicial}
        aoGuardar={() => concluido(inicial ? 'Condição atualizada' : 'Condição registada')}
      />
    );
  } else if (tipo === 'prescricao' && pacienteId) {
    const inicial = lerJson<Prescricao>(dados);
    titulo = inicial ? 'Editar prescrição' : 'Nova prescrição';
    conteudo = (
      <FormPrescricao
        pacienteId={pacienteId}
        inicial={inicial}
        aoGuardar={(p) => {
          const avisos = p.alertasAlergia?.length ?? 0;
          if (avisos > 0) {
            toast.info(`Prescrição gravada com ${avisos} aviso(s) de alergia. Confirme com o paciente.`);
            voltar();
          } else {
            concluido(inicial ? 'Prescrição atualizada' : 'Prescrição registada');
          }
        }}
      />
    );
  } else if (tipo === 'exame' && (pacienteId || dados)) {
    const inicial = lerJson<Exame>(dados);
    titulo = inicial ? 'Editar exame' : 'Pedir / registar exame';
    conteudo = (
      <FormExame
        pacienteId={pacienteId ?? inicial?.pacienteId ?? ''}
        inicial={inicial}
        aoGuardar={() => concluido(inicial ? 'Exame atualizado' : 'Exame registado')}
      />
    );
  } else if (tipo === 'anexo' && exameId) {
    titulo = 'Anexar foto ou PDF';
    conteudo = <FormAnexo exameId={Number(exameId)} aoAnexar={() => concluido('Anexo enviado')} />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Stack.Screen options={comCabecalho(titulo)} />
      {conteudo ? (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xxl }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
        >
          {pacienteNome ? (
            <View style={styles.paciente}>
              <Text style={styles.pacienteLabel}>Paciente</Text>
              <Text style={styles.pacienteNome}>{pacienteNome}</Text>
            </View>
          ) : null}
          {conteudo}
        </ScrollView>
      ) : (
        <Estado icone="file-alert-outline" titulo="Formulário inválido" texto="Volte e tente de novo." />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  scroll: { padding: spacing.xl },
  paciente: {
    backgroundColor: colors.primaryFaint,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  pacienteLabel: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textSecondary },
  pacienteNome: { fontFamily: fontFamily.semibold, fontSize: 15, color: colors.primaryDark },
});
