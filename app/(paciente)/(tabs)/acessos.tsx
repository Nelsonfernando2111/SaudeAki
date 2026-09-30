import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { obterAcessos } from '@/src/services/acesso.service';
import { useSessaoStore } from '@/src/store/sessao.store';
import { formatarDataHora } from '@/src/utils/datas';
import type { RegistoAcesso } from '@/src/types';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

function CartaoAcesso({ item }: { item: RegistoAcesso }) {
  const completo = item.tipo === 'completo';

  return (
    <View style={styles.cartao}>
      <View style={styles.avatar}>
        <MaterialCommunityIcons name="account" size={28} color={colors.primary} />
      </View>

      <View style={styles.corpo}>
        <Text style={styles.nome}>{item.medico.nome}</Text>

        <View style={styles.linhaMeta}>
          <MaterialCommunityIcons name="hospital-building" size={13} color={colors.textSecondary} />
          <Text style={styles.meta}>{item.medico.unidadeSanitaria}</Text>
        </View>

        <View
          style={[
            styles.badge,
            { backgroundColor: completo ? colors.successSoft : colors.primarySoft },
          ]}
        >
          <MaterialCommunityIcons
            name={completo ? 'shield-check-outline' : 'alert-circle-outline'}
            size={13}
            color={completo ? colors.success : colors.primary}
          />
          <Text style={[styles.badgeTexto, { color: completo ? colors.success : colors.primary }]}>
            {completo ? 'Acesso completo' : 'Acesso de emergência'}
          </Text>
        </View>

        <Text style={styles.data}>{formatarDataHora(item.data)}</Text>
      </View>
    </View>
  );
}

export default function Acessos() {
  const insets = useSafeAreaInsets();
  const paciente = useSessaoStore((s) => s.paciente);
  const [acessos, setAcessos] = useState<RegistoAcesso[]>([]);
  const [carregando, setCarregando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelado = false;
      async function carregar() {
        if (!paciente) return;
        const dados = await obterAcessos(paciente.id);
        if (cancelado) return;
        setAcessos(dados);
        setCarregando(false);
      }
      carregar();
      return () => {
        cancelado = true;
      };
    }, [paciente])
  );

  return (
    <View style={styles.container}>
      <View style={[styles.cabecalho, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.cabecalhoTitulo}>Quem acedeu ao seu histórico</Text>
      </View>

      {carregando ? (
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={acessos}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CartaoAcesso item={item} />}
          contentContainerStyle={styles.lista}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.vazio}>
              <MaterialCommunityIcons name="shield-lock-outline" size={44} color={colors.border} />
              <Text style={styles.vazioTitulo}>Nenhum acesso registado</Text>
              <Text style={styles.vazioTexto}>
                Quando um profissional de saúde aceder ao seu histórico, o registo aparece aqui.
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
  lista: { padding: spacing.xl, gap: spacing.md, flexGrow: 1 },

  cartao: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corpo: { flex: 1 },
  nome: { fontFamily: fontFamily.semibold, fontSize: 15, color: colors.text },
  linhaMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  meta: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.textSecondary },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginTop: spacing.sm,
  },
  badgeTexto: { fontFamily: fontFamily.medium, fontSize: 12 },
  data: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },

  vazio: { alignItems: 'center', marginTop: 80, paddingHorizontal: spacing.xl, gap: spacing.sm },
  vazioTitulo: { fontFamily: fontFamily.semibold, fontSize: 16, color: colors.text },
  vazioTexto: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
});