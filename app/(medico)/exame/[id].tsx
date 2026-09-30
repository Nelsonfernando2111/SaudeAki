import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { obterPaciente } from '@/src/services/paciente.service';
import { temAcessoCompleto } from '@/src/services/pedido.service';
import { useSessaoStore } from '@/src/store/sessao.store';
import { formatarData } from '@/src/utils/datas';
import type { Exame } from '@/src/types';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

export default function DetalheExame() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, pacienteId } = useLocalSearchParams<{ id: string; pacienteId: string }>();
  const medico = useSessaoStore((s) => s.medico);

  const [exame, setExame] = useState<Exame | null>(null);
  const [autorizado, setAutorizado] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      if (!id || !pacienteId) {
        setCarregando(false);
        return;
      }
      const [paciente, permitido] = await Promise.all([
        obterPaciente(pacienteId),
        temAcessoCompleto(medico?.id, pacienteId),
      ]);
      if (cancelado) return;
      setExame(paciente?.exames.find((e) => e.id === id) ?? null);
      setAutorizado(permitido);
      setCarregando(false);
    }
    carregar();
    return () => {
      cancelado = true;
    };
  }, [id, pacienteId, medico?.id]);

  function verRelatorio() {
    Alert.alert(
      'Relatório completo',
      'A visualização do relatório (PDF) será ligada quando o backend estiver disponível.'
    );
  }

  const barra = (
    <View style={[styles.barra, { paddingTop: insets.top + spacing.md }]}>
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
      </Pressable>
      <Text style={styles.barraTitulo}>Detalhe do Exame</Text>
      <View style={{ width: 24 }} />
    </View>
  );

  if (carregando) {
    return (
      <View style={styles.container}>
        {barra}
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!exame || !autorizado) {
    return (
      <View style={styles.container}>
        {barra}
        <View style={styles.centro}>
          <MaterialCommunityIcons name="file-alert-outline" size={44} color={colors.border} />
          <Text style={styles.vazioTitulo}>
            {exame ? 'Acesso não autorizado' : 'Exame não encontrado'}
          </Text>
        </View>
      </View>
    );
  }

  const parametros = exame.parametros ?? [];

  return (
    <View style={styles.container}>
      {barra}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.titulo}>{exame.nome}</Text>
        <Text style={styles.meta}>
          {formatarData(exame.data)}
          {exame.laboratorio ? ` · ${exame.laboratorio}` : ''}
        </Text>

        {parametros.length > 0 ? (
          <View style={styles.tabela}>
            <View style={[styles.linha, styles.linhaCabecalho]}>
              <Text style={[styles.celula, styles.cabecalhoTexto]}>Parâmetro</Text>
              <Text style={[styles.celula, styles.cabecalhoTexto, styles.direita]}>Resultado</Text>
            </View>
            {parametros.map((p, i) => (
              <View
                key={p.parametro}
                style={[styles.linha, i < parametros.length - 1 && styles.separador]}
              >
                <Text style={[styles.celula, styles.parametro]}>{p.parametro}</Text>
                <Text style={[styles.celula, styles.resultado, styles.direita]}>{p.resultado}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.semParametros}>
            <MaterialCommunityIcons name="table-off" size={36} color={colors.border} />
            <Text style={styles.vazioTexto}>
              Este exame não tem parâmetros registados. Consulte o relatório completo.
            </Text>
          </View>
        )}

        <Pressable
          onPress={verRelatorio}
          style={({ pressed }) => [styles.relatorio, pressed && { opacity: 0.8 }]}
        >
          <View style={styles.relatorioIcone}>
            <MaterialCommunityIcons name="file-document-outline" size={22} color={colors.primary} />
          </View>
          <Text style={styles.relatorioTexto}>Ver relatório completo</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.primary} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  barra: {
    backgroundColor: colors.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  barraTitulo: { fontFamily: fontFamily.semibold, fontSize: 18, color: colors.white },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl },

  titulo: { fontFamily: fontFamily.semibold, fontSize: 20, color: colors.text },
  meta: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: spacing.xl,
  },

  tabela: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  linhaCabecalho: { backgroundColor: colors.background, paddingVertical: spacing.md },
  separador: { borderBottomWidth: 1, borderBottomColor: colors.border },
  celula: { flex: 1 },
  direita: { textAlign: 'right' },
  cabecalhoTexto: {
    fontFamily: fontFamily.semibold,
    fontSize: 12,
    color: colors.textSecondary,
  },
  parametro: { fontFamily: fontFamily.medium, fontSize: 14, color: colors.text },
  resultado: { fontFamily: fontFamily.semibold, fontSize: 14, color: colors.text },

  semParametros: {
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  vazioTitulo: { fontFamily: fontFamily.semibold, fontSize: 16, color: colors.text },
  vazioTexto: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },

  relatorio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.lg,
  },
  relatorioIcone: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  relatorioTexto: {
    flex: 1,
    fontFamily: fontFamily.semibold,
    fontSize: 15,
    color: colors.primary,
  },
});