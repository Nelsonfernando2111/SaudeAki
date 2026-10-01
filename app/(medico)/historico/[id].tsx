import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Skeleton, SkeletonLista } from '@/src/components/anim/Skeleton';
import { VistaHistorico, type AcoesEdicao } from '@/src/components/shared/VistaHistorico';
import { Avatar } from '@/src/components/ui/Avatar';
import { Button } from '@/src/components/ui/Button';
import { Estado } from '@/src/components/ui/Estado';
import { useRecurso } from '@/src/hooks/useRecurso';
import { paraErroApi } from '@/src/services/api';
import { removerCondicao } from '@/src/services/condicao.service';
import { obterHistoricoCompleto } from '@/src/services/paciente.service';
import { encerrarPrescricao } from '@/src/services/prescricao.service';
import { toast } from '@/src/store/toast.store';
import { exportarHistoricoPdf } from '@/src/utils/historicoPdf';
import { colors, fontFamily, spacing } from '@/src/theme';

export default function HistoricoMedico() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  // Recarrega ao voltar dos formulários
  const historico = useRecurso(() => obterHistoricoCompleto(id), [id], { aoFocar: true });
  const [aExportar, setAExportar] = useState(false);

  const irParaFicha = () => router.replace(`/(medico)/paciente/${id}` as any);

  function tratarErro(e: unknown) {
    toast.erro(paraErroApi(e).message);
  }

  /** Abre o formulário de registo como ecrã próprio */
  function abrirFormulario(tipo: 'condicao' | 'prescricao' | 'exame', dados?: object) {
    const p = historico.dados?.paciente;
    router.push({
      pathname: '/formulario/[tipo]',
      params: {
        tipo,
        pacienteId: p?.id ?? id,
        pacienteNome: p?.nomeCompleto ?? '',
        ...(dados ? { dados: JSON.stringify(dados) } : {}),
      },
    } as any);
  }

  async function exportarPdf() {
    if (!historico.dados) return;
    setAExportar(true);
    try {
      await exportarHistoricoPdf(historico.dados);
    } catch {
      toast.erro('Não foi possível gerar o PDF');
    } finally {
      setAExportar(false);
    }
  }

  const edicao: AcoesEdicao = {
    aoNovaCondicao: () => abrirFormulario('condicao'),
    aoEditarCondicao: (c) => abrirFormulario('condicao', c),
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
    aoNovoExame: () => abrirFormulario('exame'),
    aoNovaPrescricao: () => abrirFormulario('prescricao'),
    aoEditarPrescricao: (p) => abrirFormulario('prescricao', p),
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
        <View style={styles.esqueleto}>
          <Skeleton altura={64} raio={16} />
          <Skeleton altura={44} raio={22} />
          <SkeletonLista itens={3} />
        </View>
      </View>
    );
  }

  if (!historico.dados) {
    const semPermissao = historico.erro?.status === 403;
    return (
      <View style={styles.container}>
        <Estado
          icone={semPermissao ? 'lock-outline' : 'cloud-alert-outline'}
          titulo={semPermissao ? 'Sem permissão para ver o histórico' : 'Não foi possível carregar'}
          texto={historico.erro?.message}
          acao={
            semPermissao
              ? { titulo: 'Ir para a ficha de emergência', onPress: irParaFicha }
              : { titulo: 'Tentar de novo', onPress: historico.atualizar }
          }
        />
      </View>
    );
  }

  const { paciente } = historico.dados;

  const topo = (
    <Animated.View entering={FadeInDown.duration(300)} style={styles.topo}>
      <View style={styles.identificacao}>
        <Avatar nome={paciente.nomeCompleto} tamanho={52} tagTransicao={`paciente-${paciente.id}`} />
        <View style={{ flex: 1 }}>
          <Text style={styles.nome}>{paciente.nomeCompleto}</Text>
          <Text style={styles.codigo}>
            {paciente.codUnico}
            {paciente.idade != null ? ` · ${paciente.idade} anos` : ''}
            {paciente.genero ? ` · ${paciente.genero}` : ''}
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>

      <VistaHistorico
        historico={historico.dados}
        aAtualizar={historico.aAtualizar}
        aoAtualizar={historico.atualizar}
        edicao={edicao}
        topo={topo}
        rodape={
          <Button
            titulo="Exportar histórico completo (PDF)"
            icone="file-pdf-box"
            variante="secundario"
            onPress={exportarPdf}
            carregando={aExportar}
          />
        }
      />

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
});
