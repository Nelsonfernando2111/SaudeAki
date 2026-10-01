import { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { IconeRotativo } from '@/src/components/anim/IconeRotativo';
import { SkeletonLista } from '@/src/components/anim/Skeleton';
import { Avatar } from '@/src/components/ui/Avatar';
import { Estado } from '@/src/components/ui/Estado';
import { Etiqueta } from '@/src/components/ui/Etiqueta';
import { useRecurso } from '@/src/hooks/useRecurso';
import { listarMeusAcessos } from '@/src/services/acesso.service';
import { paraErroApi } from '@/src/services/api';
import { toast } from '@/src/store/toast.store';
import { descreverRecurso } from '@/src/utils/clinico';
import { formatarDiaRelativo } from '@/src/utils/datas';
import type { RegistoAcesso } from '@/src/types';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

const TAMANHO_PAGINA = 20;

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

  const topo = (
    <View>
      <View style={styles.aviso}>
        <MaterialCommunityIcons name="shield-account-outline" size={22} color={colors.primary} />
        <Text style={styles.avisoTexto}>
          Os médicos podem consultar e registar dados no seu histórico sem pedir autorização. Cada
          acesso fica registado aqui, com o nome do médico, a unidade e a hora.
        </Text>
      </View>

      <View style={styles.secaoLinha}>
        <Text style={[styles.secao, { marginBottom: 0 }]}>Quem acedeu ao seu histórico</Text>
        <IconeRotativo ativo={primeiraPagina.aAtualizar || aCarregarMais} tamanho={18} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>

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
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primaryFaint,
    borderWidth: 1,
    borderColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  avisoTexto: { flex: 1, fontFamily: fontFamily.regular, fontSize: 13, color: colors.primaryDark, lineHeight: 19 },
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
