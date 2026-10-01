import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { BottomSheet } from '@/src/components/anim/BottomSheet';
import { Skeleton, SkeletonLista } from '@/src/components/anim/Skeleton';
import { FormCondicao } from '@/src/components/medico/FormCondicao';
import { FormExame } from '@/src/components/medico/FormExame';
import { FormPrescricao } from '@/src/components/medico/FormPrescricao';
import { VistaHistorico, type AcoesEdicao } from '@/src/components/shared/VistaHistorico';
import { Avatar } from '@/src/components/ui/Avatar';
import { Cabecalho } from '@/src/components/ui/Cabecalho';
import { Estado } from '@/src/components/ui/Estado';
import { useContagem } from '@/src/hooks/useContagem';
import { useRecurso } from '@/src/hooks/useRecurso';
import { useTopico } from '@/src/hooks/useTopico';
import { paraErroApi } from '@/src/services/api';
import { removerCondicao } from '@/src/services/condicao.service';
import { obterHistoricoCompleto } from '@/src/services/paciente.service';
import { listarPedidos } from '@/src/services/pedido.service';
import { encerrarPrescricao } from '@/src/services/prescricao.service';
import { topicos } from '@/src/services/realtime';
import { useSessaoStore } from '@/src/store/sessao.store';
import { toast } from '@/src/store/toast.store';
import { formatarContagem } from '@/src/utils/datas';
import { DURACAO_SESSAO_MS, sessaoProvavelmenteAtiva } from '@/src/utils/pedidos';
import type { CondicaoMedica, Prescricao, SessaoAcesso } from '@/src/types';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

type Folha =
  | { tipo: 'condicao'; inicial?: CondicaoMedica }
  | { tipo: 'prescricao'; inicial?: Prescricao }
  | { tipo: 'exame' }
  | null;

const TITULOS = {
  condicao: (editar: boolean) => (editar ? 'Editar condição' : 'Nova condição ou alergia'),
  prescricao: (editar: boolean) => (editar ? 'Editar prescrição' : 'Nova prescrição'),
  exame: () => 'Registar exame',
};

export default function HistoricoMedico() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const medico = useSessaoStore((s) => s.medico);

  const [folha, setFolha] = useState<Folha>(null);
  const [revogado, setRevogado] = useState(false);

  const historico = useRecurso(() => obterHistoricoCompleto(id), [id]);
  // A hora de fim da sessão deduz-se do pedido aprovado mais recente
  const pedidos = useRecurso(() => listarPedidos({ size: 30 }).then((p) => p.content), []);

  const pacienteUuid = historico.dados?.paciente.id ?? id;
  const aprovado = (pedidos.dados ?? []).find(
    (p) => p.pacienteId === pacienteUuid && sessaoProvavelmenteAtiva(p)
  );
  const fimSessao = aprovado?.dataResposta
    ? new Date(new Date(aprovado.dataResposta).getTime() + DURACAO_SESSAO_MS).toISOString()
    : null;
  const segundos = useContagem(fimSessao);
  const sessaoTerminou = revogado || (!!fimSessao && segundos === 0);

  // O paciente revogou: /topic/medico/{medicoId}/sessoes
  useTopico<SessaoAcesso>(medico ? topicos.sessoesDoMedico(medico.id) : null, (s) => {
    if (s?.estado === 'REVOGADA' && s.pacienteId === pacienteUuid) {
      setFolha(null);
      setRevogado(true);
      toast.info('O paciente revogou o seu acesso.');
    }
  });

  const irParaFicha = () => router.replace(`/(medico)/paciente/${pacienteUuid}` as any);

  /** Um 403 numa escrita significa que a sessão acabou */
  function tratarErro(e: unknown) {
    const err = paraErroApi(e);
    if (err.status === 403) {
      setFolha(null);
      setRevogado(true);
    }
    toast.erro(err.message);
  }

  function guardado(mensagem: string) {
    setFolha(null);
    toast.sucesso(mensagem);
    historico.recarregar();
  }

  const edicao: AcoesEdicao = {
    aoNovaCondicao: () => setFolha({ tipo: 'condicao' }),
    aoEditarCondicao: (c) => setFolha({ tipo: 'condicao', inicial: c }),
    aoRemoverCondicao: (c) =>
      Alert.alert('Remover condição', `Remover "${c.descricao}" do histórico?`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await removerCondicao(c.id);
              historico.setDados((h) => h && { ...h, condicoes: h.condicoes.filter((x) => x.id !== c.id) });
              toast.sucesso('Condição removida');
            } catch (e) {
              tratarErro(e);
            }
          },
        },
      ]),
    aoNovoExame: () => setFolha({ tipo: 'exame' }),
    aoNovaPrescricao: () => setFolha({ tipo: 'prescricao' }),
    aoEditarPrescricao: (p) => setFolha({ tipo: 'prescricao', inicial: p }),
    aoEncerrarPrescricao: (p) =>
      Alert.alert('Encerrar prescrição', `${p.nomeMedicamento} deixa de constar da medicação ativa.`, [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar',
          style: 'destructive',
          onPress: async () => {
            try {
              const nova = await encerrarPrescricao(p.id);
              historico.setDados((h) => h && { ...h, prescricoes: h.prescricoes.map((x) => (x.id === p.id ? nova : x)) });
              toast.sucesso('Prescrição encerrada');
            } catch (e) {
              tratarErro(e);
            }
          },
        },
      ]),
  };

  if (historico.carregando) {
    return (
      <View style={styles.container}>
        <Cabecalho titulo="Histórico Clínico" voltar />
        <View style={styles.esqueleto}>
          <Skeleton altura={64} raio={16} />
          <Skeleton altura={44} raio={22} />
          <SkeletonLista itens={3} />
        </View>
      </View>
    );
  }

  const semAcesso = historico.erro?.status === 403 || sessaoTerminou;

  if (!historico.dados || semAcesso) {
    return (
      <View style={styles.container}>
        <Cabecalho titulo="Histórico Clínico" voltar={irParaFicha} />
        <Estado
          icone={semAcesso ? 'lock-outline' : 'cloud-alert-outline'}
          titulo={
            revogado ? 'Acesso revogado' : semAcesso ? 'Sem sessão de acesso ativa' : 'Não foi possível carregar'
          }
          texto={
            semAcesso
              ? 'Para ver o histórico completo, peça novamente a aprovação do paciente.'
              : historico.erro?.message
          }
          acao={
            semAcesso
              ? { titulo: 'Ir para a ficha do paciente', onPress: irParaFicha }
              : { titulo: 'Tentar de novo', onPress: historico.atualizar }
          }
        />
      </View>
    );
  }

  const { paciente } = historico.dados;
  const urgente = !!fimSessao && segundos <= 120;

  const topo = (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.topo}>
      <View style={styles.identificacao}>
        <Avatar nome={paciente.nomeCompleto} tamanho={52} tagTransicao={`paciente-${paciente.id}`} />
        <View style={{ flex: 1 }}>
          <Text style={styles.nome}>{paciente.nomeCompleto}</Text>
          <Text style={styles.codigo}>{paciente.codUnico}</Text>
        </View>
      </View>
      <View style={[styles.sessao, urgente && styles.sessaoUrgente]}>
        <MaterialCommunityIcons
          name="lock-open-outline"
          size={18}
          color={urgente ? colors.error : colors.success}
        />
        <Text style={[styles.sessaoTexto, urgente && { color: colors.error }]}>
          {fimSessao ? `Sessão de acesso completo · ${formatarContagem(segundos)}` : 'Sessão de acesso completo ativa'}
        </Text>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <Cabecalho titulo="Histórico Clínico" voltar />

      <VistaHistorico
        historico={historico.dados}
        aAtualizar={historico.aAtualizar}
        aoAtualizar={() => {
          historico.atualizar();
          pedidos.recarregar();
        }}
        edicao={edicao}
        topo={topo}
      />

      <BottomSheet
        visivel={!!folha}
        aoFechar={() => setFolha(null)}
        titulo={
          folha?.tipo === 'exame'
            ? TITULOS.exame()
            : folha
              ? TITULOS[folha.tipo](!!folha.inicial)
              : ''
        }
      >
        {folha?.tipo === 'condicao' ? (
          <FormCondicao
            pacienteId={paciente.id}
            inicial={folha.inicial}
            aoGuardar={() => guardado(folha.inicial ? 'Condição atualizada' : 'Condição registada')}
          />
        ) : null}
        {folha?.tipo === 'prescricao' ? (
          <FormPrescricao
            pacienteId={paciente.id}
            inicial={folha.inicial}
            aoGuardar={() => guardado(folha.inicial ? 'Prescrição atualizada' : 'Prescrição registada')}
          />
        ) : null}
        {folha?.tipo === 'exame' ? (
          <FormExame pacienteId={paciente.id} aoGuardar={() => guardado('Exame registado')} />
        ) : null}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  esqueleto: { padding: spacing.xl, gap: spacing.lg },
  topo: { marginBottom: spacing.lg, gap: spacing.md },
  identificacao: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  nome: { fontFamily: fontFamily.semibold, fontSize: 17, color: colors.primaryDark },
  codigo: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  sessao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.successSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sessaoUrgente: { backgroundColor: colors.errorSoft },
  sessaoTexto: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.success },
});
