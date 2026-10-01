import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ItemDeslizavel } from '@/src/components/anim/ItemDeslizavel';
import { IconeRotativo } from '@/src/components/anim/IconeRotativo';
import { SkeletonLista } from '@/src/components/anim/Skeleton';
import { Avatar } from '@/src/components/ui/Avatar';
import { Cabecalho } from '@/src/components/ui/Cabecalho';
import { Estado } from '@/src/components/ui/Estado';
import { Etiqueta } from '@/src/components/ui/Etiqueta';
import { useContagem } from '@/src/hooks/useContagem';
import { useRecurso } from '@/src/hooks/useRecurso';
import { listarMeusAcessos, listarMinhasSessoes, revogarSessao } from '@/src/services/acesso.service';
import { paraErroApi } from '@/src/services/api';
import { toast } from '@/src/store/toast.store';
import { descreverRecurso } from '@/src/utils/clinico';
import { formatarContagem, formatarDiaRelativo } from '@/src/utils/datas';
import type { RegistoAcesso, SessaoAcesso } from '@/src/types';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

const TAMANHO_PAGINA = 20;

function CartaoSessao({ sessao, aoRevogar }: { sessao: SessaoAcesso; aoRevogar: () => void }) {
  const segundos = useContagem(sessao.dataExpiracao);
  return (
    <ItemDeslizavel rotulo="Revogar" icone="shield-off-outline" onAcao={aoRevogar}>
      <View style={styles.sessao}>
        <Avatar nome={sessao.medicoNome} cor={colors.success} fundo={colors.successSoft} />
        <View style={{ flex: 1 }}>
          <Text style={styles.nome}>{sessao.medicoNome}</Text>
          <Text style={styles.meta}>{sessao.unidadeSanitariaNome ?? 'Unidade não indicada'}</Text>
          <View style={styles.tempo}>
            <MaterialCommunityIcons name="timer-sand" size={13} color={colors.success} />
            <Text style={styles.tempoTexto}>Acesso completo · resta {formatarContagem(segundos)}</Text>
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-left" size={20} color={colors.textSecondary} />
      </View>
    </ItemDeslizavel>
  );
}

function CartaoAcesso({ item }: { item: RegistoAcesso }) {
  const completo = item.tipoAcesso === 'COMPLETO';
  return (
    <View style={styles.cartao}>
      <Avatar nome={item.medicoNome} />
      <View style={{ flex: 1 }}>
        <Text style={styles.nome}>{item.medicoNome}</Text>
        <Text style={styles.meta}>{descreverRecurso(item.recurso)}</Text>
        <View style={styles.linhaEtiqueta}>
          <Etiqueta
            texto={completo ? 'Acesso completo' : 'Emergência'}
            cor={completo ? colors.success : colors.primary}
            fundo={completo ? colors.successSoft : colors.primarySoft}
            icone={completo ? 'shield-check-outline' : 'alert-circle-outline'}
          />
        </View>
        <Text style={styles.data}>
          {formatarDiaRelativo(item.dataAcesso)}
          {item.unidadeSanitariaNome ? ` · ${item.unidadeSanitariaNome}` : ''}
        </Text>
      </View>
    </View>
  );
}

export default function Acessos() {
  const sessoes = useRecurso(listarMinhasSessoes, [], { aoFocar: true });
  const primeiraPagina = useRecurso(() => listarMeusAcessos(0, TAMANHO_PAGINA), [], { aoFocar: true });

  const [extra, setExtra] = useState<RegistoAcesso[]>([]);
  const [pagina, setPagina] = useState(0);
  const [aCarregarMais, setACarregarMais] = useState(false);

  const registos = [...(primeiraPagina.dados?.content ?? []), ...extra];
  const totalPaginas = primeiraPagina.dados?.totalPages ?? 1;

  function atualizar() {
    setExtra([]);
    setPagina(0);
    primeiraPagina.atualizar();
    sessoes.recarregar();
  }

  async function carregarMais() {
    if (aCarregarMais || pagina + 1 >= totalPaginas || primeiraPagina.carregando) return;
    setACarregarMais(true);
    try {
      const seguinte = await listarMeusAcessos(pagina + 1, TAMANHO_PAGINA);
      setExtra((e) => [...e, ...seguinte.content]);
      setPagina(seguinte.number);
    } catch (e) {
      toast.erro(paraErroApi(e).message);
    } finally {
      setACarregarMais(false);
    }
  }

  function confirmarRevogacao(s: SessaoAcesso) {
    Alert.alert(
      'Revogar acesso',
      `${s.medicoNome} vai perder o acesso ao seu histórico completo de imediato.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Revogar',
          style: 'destructive',
          onPress: async () => {
            try {
              await revogarSessao(s.id);
              sessoes.setDados((lista) => (lista ?? []).filter((x) => x.id !== s.id));
              toast.sucesso('Acesso revogado');
            } catch (e) {
              toast.erro(paraErroApi(e).message);
              sessoes.recarregar();
            }
          },
        },
      ]
    );
  }

  const ativas = (sessoes.dados ?? []).filter((s) => s.estado === 'ATIVA');

  const topo = (
    <View>
      <Text style={styles.secao}>Com acesso agora</Text>
      {sessoes.carregando ? (
        <SkeletonLista itens={1} />
      ) : ativas.length === 0 ? (
        <View style={styles.semSessoes}>
          <MaterialCommunityIcons name="shield-check-outline" size={22} color={colors.success} />
          <Text style={styles.semSessoesTexto}>Nenhum médico tem acesso completo neste momento.</Text>
        </View>
      ) : (
        <View style={{ gap: spacing.md }}>
          {ativas.map((s) => (
            <Animated.View key={s.id} exiting={FadeOut} layout={LinearTransition}>
              <CartaoSessao sessao={s} aoRevogar={() => confirmarRevogacao(s)} />
            </Animated.View>
          ))}
          <Text style={styles.dica}>Deslize para a esquerda para revogar o acesso.</Text>
        </View>
      )}

      <View style={styles.secaoLinha}>
        <Text style={[styles.secao, { marginBottom: 0 }]}>Quem acedeu ao seu histórico</Text>
        <IconeRotativo ativo={primeiraPagina.aAtualizar || aCarregarMais} tamanho={18} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Cabecalho titulo="Acessos" />

      <FlatList
        data={primeiraPagina.carregando ? [] : registos}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(280)}>
            <CartaoAcesso item={item} />
          </Animated.View>
        )}
        ListHeaderComponent={topo}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        onEndReached={carregarMais}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={primeiraPagina.aAtualizar}
            onRefresh={atualizar}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          primeiraPagina.carregando ? (
            <SkeletonLista itens={4} />
          ) : primeiraPagina.erro ? (
            <Estado
              icone="cloud-alert-outline"
              titulo="Não foi possível carregar"
              texto={primeiraPagina.erro.message}
              acao={{ titulo: 'Tentar de novo', onPress: atualizar }}
            />
          ) : (
            <Estado
              icone="shield-lock-outline"
              titulo="Nenhum acesso registado"
              texto="Quando um profissional de saúde consultar o seu histórico, o registo aparece aqui."
            />
          )
        }
        ListFooterComponent={
          aCarregarMais ? <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} /> : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  lista: { padding: spacing.xl, gap: spacing.md, flexGrow: 1 },
  secao: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.md,
  },
  secaoLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },
  semSessoes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.successSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  semSessoesTexto: { flex: 1, fontFamily: fontFamily.medium, fontSize: 13, color: colors.text },
  sessao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.success,
    padding: spacing.lg,
  },
  tempo: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: spacing.sm },
  tempoTexto: { fontFamily: fontFamily.medium, fontSize: 12, color: colors.success },
  dica: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
  cartao: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  nome: { fontFamily: fontFamily.semibold, fontSize: 15, color: colors.text },
  meta: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  linhaEtiqueta: { marginTop: spacing.sm },
  data: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textSecondary, marginTop: spacing.sm },
});
