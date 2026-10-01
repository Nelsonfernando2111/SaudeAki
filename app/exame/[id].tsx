import { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { ItemDeslizavel } from '@/src/components/anim/ItemDeslizavel';
import { Skeleton } from '@/src/components/anim/Skeleton';
import { Tocavel } from '@/src/components/anim/Tocavel';
import { Button } from '@/src/components/ui/Button';
import { Estado } from '@/src/components/ui/Estado';
import { Etiqueta } from '@/src/components/ui/Etiqueta';
import { useAbrirFicheiro } from '@/src/hooks/useAbrirFicheiro';
import { useRecurso } from '@/src/hooks/useRecurso';
import { VisualizadorImagem } from '@/src/components/ui/VisualizadorImagem';
import { cabecalhoAutorizacao, paraErroApi } from '@/src/services/api';
import {
  cancelarExame,
  listarAnexos,
  obterExame,
  removerAnexo,
  urlAnexo,
} from '@/src/services/exame.service';
import { useSessaoStore } from '@/src/store/sessao.store';
import { toast } from '@/src/store/toast.store';
import { INFO_CLASSIFICACAO, INFO_STATUS_EXAME, NOMES_CATEGORIA_EXAME, statusExame } from '@/src/utils/clinico';
import { formatarDataHora } from '@/src/utils/datas';
import type { AnexoExame, Exame } from '@/src/types';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

function tamanhoLegivel(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function DetalheExame() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const eMedico = useSessaoStore((s) => !!s.medico);

  const ficheiro = useAbrirFicheiro();
  const [aCancelar, setACancelar] = useState(false);
  const [imagemAberta, setImagemAberta] = useState<AnexoExame | null>(null);
  const [cabecalhos, setCabecalhos] = useState<Record<string, string>>({});

  useEffect(() => {
    cabecalhoAutorizacao().then(setCabecalhos);
  }, []);

  const exame = useRecurso(() => obterExame(id), [id], { aoFocar: true });
  const anexos = useRecurso(() => listarAnexos(id).catch(() => [] as AnexoExame[]), [id], { aoFocar: true });

  function confirmarCancelamento(e: Exame) {
    Alert.alert('Cancelar exame', 'O exame fica marcado como cancelado no histórico.', [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Cancelar exame',
        style: 'destructive',
        onPress: async () => {
          setACancelar(true);
          try {
            exame.setDados(await cancelarExame(e.id));
            toast.sucesso('Exame cancelado');
          } catch (err) {
            toast.erro(paraErroApi(err).message);
          } finally {
            setACancelar(false);
          }
        },
      },
    ]);
  }

  async function apagarAnexo(a: AnexoExame) {
    try {
      await removerAnexo(a.id);
      anexos.setDados((lista) => (lista ?? []).filter((x) => x.id !== a.id));
      toast.sucesso('Anexo removido');
    } catch (err) {
      toast.erro(paraErroApi(err).message);
    }
  }

  if (exame.carregando) {
    return (
      <View style={styles.container}>
        <View style={styles.scroll}>
          <Skeleton largura="60%" altura={22} />
          <Skeleton largura="40%" altura={14} style={{ marginTop: 10 }} />
          <Skeleton altura={180} raio={16} style={{ marginTop: spacing.xl }} />
        </View>
      </View>
    );
  }

  if (!exame.dados) {
    return (
      <View style={styles.container}>
        <Estado
          icone={exame.erro?.status === 403 ? 'lock-outline' : 'file-alert-outline'}
          titulo={exame.erro?.status === 403 ? 'Acesso não autorizado' : 'Não foi possível abrir o exame'}
          texto={exame.erro?.message}
          acao={{ titulo: 'Tentar de novo', onPress: exame.atualizar }}
        />
      </View>
    );
  }

  const e = exame.dados;
  const status = statusExame(e);
  const info = INFO_STATUS_EXAME[status];
  const podeEditar = eMedico && status !== 'CANCELADO';

  return (
    <View style={styles.container}>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={exame.aAtualizar}
            onRefresh={() => {
              exame.atualizar();
              anexos.recarregar();
            }}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <Animated.View entering={FadeInDown.duration(300)}>
          <Text style={styles.titulo}>{e.tipoExame}</Text>
          <View style={styles.etiquetas}>
            <Etiqueta texto={info.label} cor={info.cor} fundo={info.fundo} icone={info.icone} />
            {e.categoria ? (
              <Etiqueta texto={NOMES_CATEGORIA_EXAME[e.categoria]} cor={colors.primary} fundo={colors.primarySoft} />
            ) : null}
            {e.temResultadoAnormal ? (
              <Etiqueta texto="Resultado anormal" cor={colors.error} fundo={colors.errorSoft} icone="alert-circle-outline" />
            ) : null}
          </View>

          {e.indicacaoClinica ? (
            <View style={styles.indicacao}>
              <Text style={styles.indicacaoLabel}>Indicação clínica</Text>
              <Text style={styles.indicacaoTexto}>{e.indicacaoClinica}</Text>
            </View>
          ) : null}

          <View style={styles.cartao}>
            <Linha icone="calendar-clock" label="Solicitado" valor={formatarDataHora(e.dataSolicitado)} />
            <Linha icone="calendar-check" label="Realizado" valor={formatarDataHora(e.dataRealizado)} />
            <Linha icone="stethoscope" label="Médico responsável" valor={e.medicoResponsavelNome ?? '—'} />
            <Linha icone="hospital-building" label="Unidade sanitária" valor={e.unidadeSanitariaNome ?? '—'} ultima={!e.codigo} />
            {e.codigo ? <Linha icone="barcode" label="Código" valor={e.codigo} ultima /> : null}
          </View>
        </Animated.View>

        <Text style={styles.secao}>Resultados</Text>
        {e.resultado.length > 0 ? (
          <Animated.View entering={FadeInDown.delay(80).duration(300)} style={styles.tabela}>
            <View style={[styles.linhaTabela, styles.linhaCabecalho]}>
              <Text style={[styles.celula, styles.cabecalhoTexto]}>Parâmetro</Text>
              <Text style={[styles.celula, styles.cabecalhoTexto, styles.direita]}>Resultado</Text>
            </View>
            {e.resultado.map((r, i) => (
              <View
                key={r.id ?? r.nomeParametro}
                style={[styles.linhaTabela, i < e.resultado.length - 1 && styles.separador]}
              >
                <View style={styles.celula}>
                  <Text style={styles.parametro}>{r.nomeParametro}</Text>
                  {r.valorReferencia ? (
                    <Text style={styles.referencia}>Ref.: {r.valorReferencia}</Text>
                  ) : null}
                </View>
                <View style={[styles.celula, { alignItems: 'flex-end', gap: 4 }]}>
                  <Text style={[styles.resultado, r.anormal && { color: colors.error }]}>
                    {r.valor}
                    {r.unidadeMedida ? ` ${r.unidadeMedida}` : ''}
                  </Text>
                  {r.classificacao ? (
                    <Etiqueta
                      texto={INFO_CLASSIFICACAO[r.classificacao].label}
                      cor={INFO_CLASSIFICACAO[r.classificacao].cor}
                      fundo={INFO_CLASSIFICACAO[r.classificacao].fundo}
                    />
                  ) : null}
                </View>
              </View>
            ))}
          </Animated.View>
        ) : (
          <View style={styles.semDados}>
            <MaterialCommunityIcons name="table-off" size={32} color={colors.border} />
            <Text style={styles.semDadosTexto}>Ainda não há resultados lançados.</Text>
          </View>
        )}

        {e.achados || e.conclusao || e.responsavelLaudoNome ? (
          <>
            <Text style={styles.secao}>Laudo</Text>
            <Animated.View entering={FadeInDown.delay(120).duration(300)} style={styles.laudo}>
              {e.achados ? (
                <View>
                  <Text style={styles.indicacaoLabel}>Achados</Text>
                  <Text style={styles.indicacaoTexto}>{e.achados}</Text>
                </View>
              ) : null}
              {e.conclusao ? (
                <View>
                  <Text style={styles.indicacaoLabel}>Conclusão</Text>
                  <Text style={[styles.indicacaoTexto, { fontFamily: fontFamily.semibold }]}>{e.conclusao}</Text>
                </View>
              ) : null}
              {e.responsavelLaudoNome ? (
                <Text style={styles.laudoAssinatura}>
                  {e.responsavelLaudoNome}
                  {e.responsavelLaudoNumeroOrdem ? ` · ${e.responsavelLaudoNumeroOrdem}` : ''}
                </Text>
              ) : null}
            </Animated.View>
          </>
        ) : null}

        <Text style={styles.secao}>Anexos</Text>
        {anexos.carregando ? (
          <Skeleton altura={64} raio={16} />
        ) : (anexos.dados ?? []).length === 0 ? (
          <View style={styles.semDados}>
            <MaterialCommunityIcons name="paperclip" size={28} color={colors.border} />
            <Text style={styles.semDadosTexto}>Sem fotos ou PDFs anexados.</Text>
          </View>
        ) : (
          <View style={{ gap: spacing.sm }}>
            {(anexos.dados ?? []).map((a, i) => {
              const eImagem = a.contentType.startsWith('image/');
              return (
                <Animated.View key={a.id} entering={FadeInDown.delay(i * 60)}>
                  <ItemDeslizavel
                    rotulo="Remover"
                    icone="trash-can-outline"
                    desativado={!eMedico}
                    onAcao={() => apagarAnexo(a)}
                  >
                    <Tocavel
                      style={styles.anexo}
                      disabled={ficheiro.aAbrir}
                      onPress={() => (eImagem ? setImagemAberta(a) : ficheiro.abrir(a.url))}
                    >
                      {eImagem ? (
                        <Image
                          source={{ uri: urlAnexo(a), headers: cabecalhos }}
                          style={styles.miniatura}
                        />
                      ) : (
                        <View style={[styles.miniatura, styles.pdf]}>
                          <MaterialCommunityIcons name="file-pdf-box" size={28} color={colors.error} />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.anexoNome} numberOfLines={1}>
                          {a.descricao || a.nomeArquivo}
                        </Text>
                        <Text style={styles.anexoMeta}>
                          {a.nomeArquivo} · {tamanhoLegivel(a.tamanhoBytes)}
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name={eImagem ? 'magnify-plus-outline' : 'open-in-new'}
                        size={20}
                        color={colors.primary}
                      />
                    </Tocavel>
                  </ItemDeslizavel>
                </Animated.View>
              );
            })}
          </View>
        )}

        {podeEditar ? (
          <View style={styles.acoes}>
            <Button
              titulo="Editar / lançar resultados"
              icone="pencil-outline"
              onPress={() =>
                router.push({
                  pathname: '/formulario/[tipo]',
                  params: { tipo: 'exame', dados: JSON.stringify(e), pacienteNome: e.pacienteNome },
                } as any)
              }
            />
            <Button
              titulo="Anexar foto ou PDF"
              icone="paperclip"
              variante="secundario"
              onPress={() =>
                router.push({
                  pathname: '/formulario/[tipo]',
                  params: { tipo: 'anexo', exameId: String(e.id), pacienteNome: e.pacienteNome },
                } as any)
              }
            />
            <Button
              titulo="Cancelar exame"
              variante="perigoContorno"
              onPress={() => confirmarCancelamento(e)}
              carregando={aCancelar}
            />
          </View>
        ) : null}
      </ScrollView>



      <VisualizadorImagem uri={ficheiro.imagemLocal} aoFechar={ficheiro.fecharImagem} />

      <Modal
        visible={!!imagemAberta}
        transparent
        animationType="fade"
        onRequestClose={() => setImagemAberta(null)}
      >
        <Pressable style={styles.visualizador} onPress={() => setImagemAberta(null)}>
          {imagemAberta ? (
            <Animated.View entering={FadeIn} style={{ flex: 1, alignSelf: 'stretch' }}>
              <Image
                source={{ uri: urlAnexo(imagemAberta), headers: cabecalhos }}
                style={{ flex: 1 }}
                resizeMode="contain"
              />
            </Animated.View>
          ) : null}
        </Pressable>
      </Modal>
    </View>
  );
}

function Linha({
  icone,
  label,
  valor,
  ultima,
}: {
  icone: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  label: string;
  valor: string;
  ultima?: boolean;
}) {
  return (
    <View style={[styles.linha, !ultima && styles.separador]}>
      <MaterialCommunityIcons name={icone} size={20} color={colors.primary} />
      <Text style={styles.linhaLabel}>{label}</Text>
      <Text style={styles.linhaValor} numberOfLines={1}>
        {valor}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl },
  titulo: { fontFamily: fontFamily.semibold, fontSize: 22, color: colors.primaryDark },
  etiquetas: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: spacing.sm, marginBottom: spacing.lg },
  indicacao: {
    backgroundColor: colors.primaryFaint,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  indicacaoLabel: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textSecondary },
  indicacaoTexto: { fontFamily: fontFamily.regular, fontSize: 14, color: colors.text, marginTop: 2, lineHeight: 20 },
  laudo: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  laudoAssinatura: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.primaryDark,
    textAlign: 'right',
  },
  cartao: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  linha: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  linhaLabel: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.textSecondary },
  linhaValor: {
    flex: 1,
    textAlign: 'right',
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.text,
  },
  secao: {
    fontFamily: fontFamily.semibold,
    fontSize: 16,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  tabela: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  linhaTabela: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  linhaCabecalho: { backgroundColor: colors.primaryFaint },
  separador: { borderBottomWidth: 1, borderBottomColor: colors.border },
  celula: { flex: 1 },
  direita: { textAlign: 'right' },
  cabecalhoTexto: { fontFamily: fontFamily.semibold, fontSize: 12, color: colors.primaryDark },
  parametro: { fontFamily: fontFamily.medium, fontSize: 14, color: colors.text },
  referencia: { fontFamily: fontFamily.regular, fontSize: 11, color: colors.textSecondary, marginTop: 1 },
  resultado: { fontFamily: fontFamily.semibold, fontSize: 14, color: colors.text },
  semDados: {
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xl,
  },
  semDadosTexto: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.textSecondary },
  anexo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  miniatura: { width: 48, height: 48, borderRadius: radius.sm, backgroundColor: colors.background },
  pdf: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.errorSoft },
  anexoNome: { fontFamily: fontFamily.semibold, fontSize: 14, color: colors.text },
  anexoMeta: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  acoes: { gap: spacing.md, marginTop: spacing.xl },
  visualizador: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
});
