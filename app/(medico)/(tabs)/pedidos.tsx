import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AbasPilula } from '@/src/components/ui/AbasPilula';
import { CartaoPedido } from '@/src/components/shared/CartaoPedido';
import { listarPedidosMedico } from '@/src/services/pedido.service';
import { useSessaoStore } from '@/src/store/sessao.store';
import { estadoEfetivo } from '@/src/utils/pedidos';
import type { PedidoAcesso } from '@/src/types';
import { colors, fontFamily, spacing } from '@/src/theme';

type Filtro = 'todos' | 'pendentes' | 'aprovados';

const FILTROS: { chave: Filtro; titulo: string }[] = [
  { chave: 'todos', titulo: 'Todos' },
  { chave: 'pendentes', titulo: 'Pendentes' },
  { chave: 'aprovados', titulo: 'Aprovados' },
];

export default function Pedidos() {
  const insets = useSafeAreaInsets();
  const medico = useSessaoStore((s) => s.medico);
  const [pedidos, setPedidos] = useState<PedidoAcesso[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtro, setFiltro] = useState<Filtro>('todos');

  useFocusEffect(
    useCallback(() => {
      let cancelado = false;
      async function carregar() {
        if (!medico) return;
        const dados = await listarPedidosMedico(medico.id);
        if (cancelado) return;
        setPedidos(dados);
        setCarregando(false);
      }
      carregar();
      return () => {
        cancelado = true;
      };
    }, [medico])
  );

  const visiveis = pedidos.filter((p) => {
    const estado = estadoEfetivo(p);
    if (filtro === 'pendentes') return estado === 'pendente';
    if (filtro === 'aprovados') return estado === 'aprovado';
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={[styles.cabecalho, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.cabecalhoTitulo}>Pedidos</Text>
      </View>

      <View style={styles.filtros}>
        <AbasPilula abas={FILTROS} ativa={filtro} onMudar={setFiltro} />
      </View>

      {carregando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={visiveis}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CartaoPedido pedido={item} />}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.vazio}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={44} color={colors.border} />
              <Text style={styles.vazioTitulo}>Nenhum pedido</Text>
              <Text style={styles.vazioTexto}>
                {filtro === 'todos'
                  ? 'Os pedidos de acesso que enviar aparecem aqui.'
                  : 'Não há pedidos neste filtro.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cabecalho: {
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
  cabecalhoTitulo: { fontFamily: fontFamily.semibold, fontSize: 18, color: colors.white },
  filtros: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  lista: { padding: spacing.xl, gap: spacing.md, flexGrow: 1 },
  vazio: { alignItems: 'center', marginTop: 60, gap: spacing.sm, paddingHorizontal: spacing.xl },
  vazioTitulo: { fontFamily: fontFamily.semibold, fontSize: 16, color: colors.text },
  vazioTexto: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
});