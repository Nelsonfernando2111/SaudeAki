import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Button } from '@/src/components/ui/Button';
import { useContagem } from '@/src/hooks/useContagem';
import { cancelarPedido, obterPedido, responderPedido } from '@/src/services/pedido.service';
import type { PedidoAcesso } from '@/src/types';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type Resultado = 'negado' | 'expirado' | 'cancelado';

const INTERVALO_MS = 2000;

function LinhaDados({ icone, label, valor }: { icone: IconName; label: string; valor: string }) {
  return (
    <View style={styles.linhaDados}>
      <MaterialCommunityIcons name={icone} size={20} color={colors.textSecondary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.linhaLabel}>{label}</Text>
        <Text style={styles.linhaValor}>{valor}</Text>
      </View>
    </View>
  );
}

const doisDigitos = (n: number) => String(n).padStart(2, '0');

export default function AguardandoAprovacao() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [pedido, setPedido] = useState<PedidoAcesso | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [aCancelar, setACancelar] = useState(false);

  const segundos = useContagem(pedido?.expiraEm);

  function irParaHistorico(pacienteId: string) {
    router.replace(`/(medico)/historico/${pacienteId}` as any);
  }

  function aplicarEstado(dados: PedidoAcesso) {
    setPedido(dados);
    if (dados.estado === 'aprovado') irParaHistorico(dados.paciente.id);
    else if (dados.estado === 'negado') setResultado('negado');
    else if (dados.estado === 'cancelado') setResultado('cancelado');
    else if (dados.estado === 'expirado') setResultado('expirado');
  }

  // Consulta o estado do pedido de 2 em 2 segundos
  useEffect(() => {
    if (!id || resultado) return;
    let cancelado = false;
    let timer: ReturnType<typeof setTimeout>;

    async function verificar() {
      const dados = await obterPedido(id);
      if (cancelado) return;
      if (dados) aplicarEstado(dados);
      setCarregando(false);
      timer = setTimeout(verificar, INTERVALO_MS);
    }

    verificar();
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, resultado]);

  // Tempo esgotado (confirma com a hora real para evitar falsos positivos)
  useEffect(() => {
    if (!pedido || resultado || pedido.estado !== 'pendente') return;
    if (Date.now() >= new Date(pedido.expiraEm).getTime()) {
      setResultado('expirado');
    }
  }, [segundos, pedido, resultado]);

  function confirmarCancelamento() {
    Alert.alert('Cancelar pedido', 'Deseja cancelar o pedido de acesso?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim, cancelar',
        style: 'destructive',
        onPress: async () => {
          if (!pedido) return;
          setACancelar(true);
          await cancelarPedido(pedido.id);
          setACancelar(false);
          setResultado('cancelado');
        },
      },
    ]);
  }

  async function simularResposta(estado: 'aprovado' | 'negado') {
    if (!pedido) return;
    await responderPedido(pedido.id, estado);
    const dados = await obterPedido(pedido.id);
    if (dados) aplicarEstado(dados);
  }

  function fechar() {
    router.replace('/(medico)/(tabs)/pacientes' as any);
  }

  if (carregando || !pedido) {
    return (
      <View style={[styles.container, styles.centro]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  /* ---------- Estados finais ---------- */
  if (resultado) {
    const config = {
      negado: {
        icone: 'close' as IconName,
        cor: colors.error,
        fundo: colors.errorSoft,
        titulo: 'Acesso negado',
        texto: 'O paciente não autorizou o acesso ao histórico clínico.',
      },
      expirado: {
        icone: 'clock-alert-outline' as IconName,
        cor: colors.warning,
        fundo: colors.warningSoft,
        titulo: 'Pedido expirado',
        texto: 'O paciente não respondeu a tempo. Pode enviar um novo pedido.',
      },
      cancelado: {
        icone: 'cancel' as IconName,
        cor: colors.textSecondary,
        fundo: colors.border,
        titulo: 'Pedido cancelado',
        texto: 'O pedido de acesso foi cancelado.',
      },
    }[resultado];

    return (
      <View style={[styles.container, styles.centro, { padding: spacing.xl }]}>
        <View style={[styles.iconeGrande, { backgroundColor: config.fundo }]}>
          <MaterialCommunityIcons name={config.icone} size={44} color={config.cor} />
        </View>
        <Text style={styles.titulo}>{config.titulo}</Text>
        <Text style={styles.texto}>{config.texto}</Text>
        <View style={{ alignSelf: 'stretch', marginTop: spacing.xl }}>
          <Button titulo="Voltar à pesquisa" onPress={fechar} />
        </View>
      </View>
    );
  }

  /* ---------- A aguardar ---------- */
  const urgente = segundos <= 10;
  const tempo = `${doisDigitos(Math.floor(segundos / 60))}:${doisDigitos(segundos % 60)}`;

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xl }]}>
      <View style={styles.conteudo}>
        <View style={[styles.iconeGrande, { backgroundColor: colors.primarySoft }]}>
          <MaterialCommunityIcons name="clock-outline" size={48} color={colors.primary} />
        </View>
        <Text style={styles.titulo}>Aguardando aprovação</Text>
        <Text style={styles.texto}>
          O pedido de acesso completo foi enviado ao paciente. Iremos notificar assim que houver uma
          resposta.
        </Text>

        <View style={styles.cartao}>
          <LinhaDados icone="account-outline" label="Paciente" valor={pedido.paciente.nome} />
          <LinhaDados icone="stethoscope" label="Médico" valor={pedido.medico.nome} />
          <LinhaDados
            icone="hospital-building"
            label="Unidade sanitária"
            valor={pedido.medico.unidadeSanitaria}
          />
        </View>

        <View style={[styles.tempo, urgente && styles.tempoUrgente]}>
          <Text style={styles.tempoLabel}>Tempo limite</Text>
          <View style={styles.tempoValorLinha}>
            <MaterialCommunityIcons name="timer-outline" size={22} color={colors.error} />
            <Text style={styles.tempoValor}>{tempo}</Text>
          </View>
        </View>

        <View style={{ alignSelf: 'stretch' }}>
          <Button
            titulo="Cancelar pedido"
            variante="perigo"
            onPress={confirmarCancelamento}
            carregando={aCancelar}
          />
        </View>

        {/* DEMO: remover quando houver notificações reais */}
        <View style={styles.demo}>
          <Text style={styles.demoTitulo}>Demo: simular resposta do paciente</Text>
          <View style={styles.demoBotoes}>
            <Pressable
              style={[styles.demoBotao, { borderColor: colors.success }]}
              onPress={() => simularResposta('aprovado')}
            >
              <Text style={[styles.demoTexto, { color: colors.success }]}>Aprovar</Text>
            </Pressable>
            <Pressable
              style={[styles.demoBotao, { borderColor: colors.error }]}
              onPress={() => simularResposta('negado')}
            >
              <Text style={[styles.demoTexto, { color: colors.error }]}>Negar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centro: { alignItems: 'center', justifyContent: 'center' },
  conteudo: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.xl, gap: spacing.md },
  iconeGrande: {
    width: 96,
    height: 96,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  titulo: { fontFamily: fontFamily.semibold, fontSize: 20, color: colors.text, textAlign: 'center' },
  texto: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  cartao: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  linhaDados: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  linhaLabel: { fontFamily: fontFamily.regular, fontSize: 11, color: colors.textSecondary },
  linhaValor: { fontFamily: fontFamily.medium, fontSize: 14, color: colors.text },
  tempo: {
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: colors.errorSoft,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tempoUrgente: { borderColor: colors.error },
  tempoLabel: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.error },
  tempoValorLinha: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  tempoValor: { fontFamily: fontFamily.bold, fontSize: 22, color: colors.error },
  demo: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    gap: spacing.sm,
  },
  demoTitulo: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.primary,
    textAlign: 'center',
  },
  demoBotoes: { flexDirection: 'row', gap: spacing.md },
  demoBotao: {
    flex: 1,
    height: 38,
    borderRadius: radius.md,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  demoTexto: { fontFamily: fontFamily.semibold, fontSize: 13 },
});