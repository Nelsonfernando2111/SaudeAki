import { useEffect } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Expansivel } from '@/src/components/anim/Expansivel';
import { Skeleton, SkeletonLista } from '@/src/components/anim/Skeleton';
import { Avatar } from '@/src/components/ui/Avatar';
import { Button } from '@/src/components/ui/Button';
import { Estado } from '@/src/components/ui/Estado';
import { Destaques } from '@/src/components/ui/Destaques';
import { Etiqueta } from '@/src/components/ui/Etiqueta';
import { CartaoDocumento } from '@/src/components/shared/CartaoDocumento';
import { useRecurso } from '@/src/hooks/useRecurso';
import { useVoltar } from '@/src/hooks/useVoltar';
import { obterFichaEmergencia } from '@/src/services/paciente.service';
import { useRecentesStore } from '@/src/store/recentes.store';
import { INFO_CONDUTA, INFO_SEVERIDADE, posologia, tipoSanguineo } from '@/src/utils/clinico';
import type { CondicaoMedica } from '@/src/types';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

function ListaCondicoes({ itens, vazio }: { itens: CondicaoMedica[]; vazio: string }) {
  if (itens.length === 0) return <Text style={styles.vazio}>{vazio}</Text>;
  return (
    <View style={{ paddingBottom: spacing.sm }}>
      {itens.map((c) => {
        const sev = INFO_SEVERIDADE[c.severidade];
        const conduta = c.conduta ? INFO_CONDUTA[c.conduta] : null;
        const detalhe = [c.agente ? `Agente: ${c.agente}` : null, c.reacaoObservada ? `Reação: ${c.reacaoObservada}` : null, c.codigoCid ? `CID ${c.codigoCid}` : null]
          .filter(Boolean)
          .join(' · ');
        return (
          <View key={c.id} style={styles.item}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.itemTexto}>{c.descricao}</Text>
              {detalhe ? <Text style={styles.itemSub}>{detalhe}</Text> : null}
              {conduta ? (
                <Etiqueta texto={conduta.label} cor={conduta.cor} fundo={conduta.fundo} icone="shield-alert-outline" />
              ) : null}
            </View>
            <Etiqueta texto={sev.label} cor={sev.cor} fundo={sev.fundo} />
          </View>
        );
      })}
    </View>
  );
}

export default function FichaPaciente() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const voltar = useVoltar();
  const registarRecente = useRecentesStore((s) => s.registar);

  const ficha = useRecurso(() => obterFichaEmergencia(id), [id]);
  const f = ficha.dados;

  // Guarda nos "pacientes recentes" do médico
  useEffect(() => {
    if (f) registarRecente({ id, codUnico: f.codUnicoPaciente, nome: f.nomeCompleto });
  }, [f, id, registarRecente]);

  const abrirHistorico = () => router.push(`/(medico)/historico/${f?.codUnicoPaciente ?? id}` as any);

  if (ficha.carregando) {
    return (
      <View style={styles.container}>
        <View style={styles.scroll}>
          <View style={styles.identificacao}>
            <Skeleton largura={68} altura={68} raio={34} />
            <View style={{ flex: 1, gap: 8 }}>
              <Skeleton largura="70%" altura={18} />
              <Skeleton largura="40%" altura={12} />
            </View>
          </View>
          <SkeletonLista itens={3} />
        </View>
      </View>
    );
  }

  if (!f) {
    const naoExiste = ficha.erro?.status === 404;
    return (
      <View style={styles.container}>
        <Estado
          icone={naoExiste ? 'account-question-outline' : 'cloud-alert-outline'}
          titulo={naoExiste ? 'Paciente não encontrado' : 'Não foi possível carregar a ficha'}
          texto={naoExiste ? `Não existe nenhum paciente com o código ${id}.` : ficha.erro?.message}
          acao={{ titulo: naoExiste ? 'Voltar' : 'Tentar de novo', onPress: naoExiste ? voltar : ficha.atualizar }}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={ficha.aAtualizar}
            onRefresh={ficha.atualizar}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.identificacao}>
          <Avatar nome={f.nomeCompleto} tamanho={68} tagTransicao={`paciente-${id}`} />
          <View style={{ flex: 1 }}>
            <Text style={styles.nome}>{f.nomeCompleto}</Text>
            <Text style={styles.codigo}>{f.codUnicoPaciente}</Text>
          </View>
        </View>

        <Animated.View entering={FadeInDown.duration(300)} style={styles.aviso}>
          <MaterialCommunityIcons name="alert-decagram-outline" size={20} color={colors.primary} />
          <Text style={styles.avisoTexto}>
            Acesso de emergência: não precisa de aprovação, mas fica registado no histórico do paciente.
          </Text>
        </Animated.View>

        <Destaques
          itens={[
            f.diabetico
              ? { icone: 'diabetes', texto: 'Diabético', alerta: true }
              : { icone: 'check-circle-outline', texto: 'Não diabético' },
            ...(f.alergias.some((a) => a.severidade === 'CRITICA' || a.conduta === 'BLOQUEIO_ABSOLUTO')
              ? [{ icone: 'alert-octagon-outline' as const, texto: 'Alergia crítica', alerta: true }]
              : []),
            ...(f.medicacaoAtiva.length > 0
              ? [{ icone: 'pill' as const, texto: `${f.medicacaoAtiva.length} medicamento(s) ativo(s)` }]
              : []),
          ]}
        />

        <Animated.View entering={FadeInDown.delay(60).duration(300)} style={styles.sangue}>
          <MaterialCommunityIcons name="water" size={26} color={colors.error} />
          <Text style={styles.sangueLabel}>Tipo sanguíneo</Text>
          <Text style={styles.sangueValor}>
            {tipoSanguineo(f.tipoSanguineo?.grupoSanguineo, f.tipoSanguineo?.fatorRh)}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(300)} style={styles.grupo}>
          <Expansivel titulo={`Alergias (${f.alergias.length})`} inicialAberto>
            <ListaCondicoes itens={f.alergias} vazio="Nenhuma alergia registada" />
          </Expansivel>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).duration(300)} style={styles.grupo}>
          <Expansivel titulo={`Condições crónicas (${f.condicoesCronicas.length})`} inicialAberto>
            <ListaCondicoes itens={f.condicoesCronicas} vazio="Nenhuma condição registada" />
          </Expansivel>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(240).duration(300)} style={styles.grupo}>
          <Expansivel titulo={`Medicação ativa (${f.medicacaoAtiva.length})`} inicialAberto>
            {f.medicacaoAtiva.length === 0 ? (
              <Text style={styles.vazio}>Sem medicação ativa</Text>
            ) : (
              <View style={{ paddingBottom: spacing.sm }}>
                {f.medicacaoAtiva.map((m) => (
                  <View key={m.id} style={styles.item}>
                    <MaterialCommunityIcons name="pill" size={18} color={colors.purple} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemTexto}>{m.nomeMedicamento}</Text>
                      <Text style={styles.itemSub}>{posologia(m)}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </Expansivel>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(300).duration(300)}>
          <CartaoDocumento pacienteId={id} />
        </Animated.View>
      </ScrollView>

      <View style={[styles.rodape, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button titulo="Abrir histórico completo" icone="folder-account-outline" onPress={abrirHistorico} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.md },
  identificacao: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginBottom: spacing.sm },
  nome: { fontFamily: fontFamily.semibold, fontSize: 18, color: colors.primaryDark },
  codigo: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  aviso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primaryFaint,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  avisoTexto: { flex: 1, fontFamily: fontFamily.regular, fontSize: 12, color: colors.primaryDark, lineHeight: 17 },
  sangue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.errorSoft,
    padding: spacing.lg,
  },
  sangueLabel: { flex: 1, fontFamily: fontFamily.medium, fontSize: 15, color: colors.text },
  sangueValor: { fontFamily: fontFamily.bold, fontSize: 22, color: colors.error },
  grupo: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  itemTexto: { flex: 1, fontFamily: fontFamily.medium, fontSize: 14, color: colors.text },
  itemSub: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  vazio: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.textSecondary, paddingBottom: spacing.md },
  rodape: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
