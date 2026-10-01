import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { IconeRotativo } from '@/src/components/anim/IconeRotativo';
import { SkeletonLista } from '@/src/components/anim/Skeleton';
import { CartaoPedido } from '@/src/components/shared/CartaoPedido';
import { AbasPilula } from '@/src/components/ui/AbasPilula';
import { Cabecalho } from '@/src/components/ui/Cabecalho';
import { Estado } from '@/src/components/ui/Estado';
import { useRecurso } from '@/src/hooks/useRecurso';
import { paraErroApi } from '@/src/services/api';
import { listarPedidos } from '@/src/services/pedido.service';
import { toast } from '@/src/store/toast.store';
import { estadoEfetivo } from '@/src/utils/pedidos';
import type { PedidoAcesso } from '@/src/types';
import { colors, spacing } from '@/src/theme';

type Filtro = 'todos' | 'pendentes' | 'aprovados' | 'recusados';

const FILTROS: { chave: Filtro; titulo: string }[] = [
  { chave: 'todos', titulo: 'Todos' },
  { chave: 'pendentes', titulo: 'Pendentes' },
  { chave: 'aprovados', titulo: 'Aprovados' },
  { chave: 'recusados', titulo: 'Recusados' },
];

const TAMANHO_PAGINA = 20;

export default function Pedidos() {
  const [filtro, setFiltro] = useState<Filtro>('todos');
  const [extra, setExtra] = useState<PedidoAcesso[]>([]);
  const [pagina, setPagina] = useState(0);
  const [aCarregarMais, setACarregarMais] = useState(false);

  // O filtro `estado` da API só funciona para pacientes: o médico filtra localmente
  const primeira = useRecurso(() => listarPedidos({ page: 0, size: TAMANHO_PAGINA }), [], {
    aoFocar: true,
  });

  const todos = [...(primeira.dados?.content ?? []), ...extra];
  const visiveis = todos.filter((p) => {
    const e = estadoEfetivo(p);
    if (filtro === 'pendentes') return e === 'PENDENTE';
    if (filtro === 'aprovados') return e === 'APROVADO';
    if (filtro === 'recusados') return e === 'RECUSADO' || e === 'EXPIRADO';
    return true;
  });

  function atualizar() {
    setExtra([]);
    setPagina(0);
    primeira.atualizar();
  }

  async function carregarMais() {
    const total = primeira.dados?.totalPages ?? 1;
    if (aCarregarMais || primeira.carregando || pagina + 1 >= total) return;
    setACarregarMais(true);
    try {
      const seguinte = await listarPedidos({ page: pagina + 1, size: TAMANHO_PAGINA });
      setExtra((e) => [...e, ...seguinte.content]);
      setPagina(seguinte.number);
    } catch (e) {
      toast.erro(paraErroApi(e).message);
    } finally {
      setACarregarMais(false);
    }
  }

  return (
    <View style={styles.container}>
      <Cabecalho titulo="Pedidos" direita={<IconeRotativo ativo={primeira.aAtualizar} tamanho={20} />} />

      <View style={styles.filtros}>
        <AbasPilula abas={FILTROS} ativa={filtro} onMudar={setFiltro} />
      </View>

      <FlatList
        data={primeira.carregando ? [] : visiveis}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(280)}>
            <CartaoPedido pedido={item} />
          </Animated.View>
        )}
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        onEndReached={carregarMais}
        onEndReachedThreshold={0.4}
        refreshControl={
          <RefreshControl
            refreshing={primeira.aAtualizar}
            onRefresh={atualizar}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          primeira.carregando ? (
            <SkeletonLista itens={5} />
          ) : primeira.erro ? (
            <Estado
              icone="cloud-alert-outline"
              titulo="Não foi possível carregar"
              texto={primeira.erro.message}
              acao={{ titulo: 'Tentar de novo', onPress: atualizar }}
            />
          ) : (
            <Estado
              icone="clipboard-text-outline"
              titulo="Nenhum pedido"
              texto={
                filtro === 'todos'
                  ? 'Os pedidos de acesso que enviar aparecem aqui.'
                  : 'Não há pedidos neste filtro.'
              }
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
  filtros: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  lista: { padding: spacing.xl, gap: spacing.md, flexGrow: 1 },
});
