import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Expansivel } from '@/src/components/anim/Expansivel';
import { ItemDeslizavel } from '@/src/components/anim/ItemDeslizavel';
import { Tocavel } from '@/src/components/anim/Tocavel';
import { AbasPilula } from '@/src/components/ui/AbasPilula';
import { Etiqueta } from '@/src/components/ui/Etiqueta';
import {
  dataExame,
  INFO_SEVERIDADE,
  INFO_STATUS_EXAME,
  posologia,
  statusExame,
  tipoSanguineo,
} from '@/src/utils/clinico';
import { formatarData } from '@/src/utils/datas';
import type { CondicaoMedica, HistoricoClinico, Prescricao } from '@/src/types';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type Aba = 'resumo' | 'exames' | 'prescricoes';

const ABAS: { chave: Aba; titulo: string }[] = [
  { chave: 'resumo', titulo: 'Resumo' },
  { chave: 'exames', titulo: 'Exames' },
  { chave: 'prescricoes', titulo: 'Prescrições' },
];

/** Ações do médico com sessão ativa. Sem isto, a vista é só de leitura. */
export interface AcoesEdicao {
  aoNovaCondicao: () => void;
  aoEditarCondicao: (c: CondicaoMedica) => void;
  aoRemoverCondicao: (c: CondicaoMedica) => void;
  aoNovoExame: () => void;
  aoNovaPrescricao: () => void;
  aoEditarPrescricao: (p: Prescricao) => void;
  aoEncerrarPrescricao: (p: Prescricao) => void;
}

interface Props {
  historico: HistoricoClinico;
  aAtualizar: boolean;
  aoAtualizar: () => void;
  edicao?: AcoesEdicao;
  /** Conteúdo acima das abas (ex.: identificação, tempo de sessão) */
  topo?: React.ReactNode;
}

const entrada = (i: number) => FadeInDown.delay(Math.min(i, 8) * 45).duration(300);

function Linha({
  icone,
  cor,
  fundo,
  principal,
  secundario,
  direita,
  onPress,
}: {
  icone: IconName;
  cor: string;
  fundo: string;
  principal: string;
  secundario?: string;
  direita?: React.ReactNode;
  onPress?: () => void;
}) {
  const conteudo = (
    <>
      <View style={[styles.linhaIcone, { backgroundColor: fundo }]}>
        <MaterialCommunityIcons name={icone} size={20} color={cor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.linhaPrincipal}>{principal}</Text>
        {secundario ? <Text style={styles.linhaSecundaria}>{secundario}</Text> : null}
      </View>
      {direita}
      {onPress ? <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} /> : null}
    </>
  );
  if (!onPress) return <View style={styles.linha}>{conteudo}</View>;
  return (
    <Tocavel onPress={onPress} style={styles.linha} escala={0.98}>
      {conteudo}
    </Tocavel>
  );
}

function BotaoAdicionar({ titulo, onPress }: { titulo: string; onPress: () => void }) {
  return (
    <Tocavel onPress={onPress} style={styles.adicionar} escala={0.97}>
      <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.primary} />
      <Text style={styles.adicionarTexto}>{titulo}</Text>
    </Tocavel>
  );
}

function Vazio({ texto }: { texto: string }) {
  return <Text style={styles.vazio}>{texto}</Text>;
}

export function VistaHistorico({ historico, aAtualizar, aoAtualizar, edicao, topo }: Props) {
  const router = useRouter();
  const [aba, setAba] = useState<Aba>('resumo');
  const { paciente, condicoes, exames, prescricoes } = historico;

  const alergias = condicoes.filter((c) => c.tipo === 'ALERGIA');
  const cronicas = condicoes.filter((c) => c.tipo === 'DOENCA_CRONICA');
  const ativas = prescricoes.filter((p) => p.ativa);
  const encerradas = prescricoes.filter((p) => !p.ativa);
  const examesOrdenados = [...exames].sort((a, b) => dataExame(b).localeCompare(dataExame(a)));

  const abrirExame = (id: number) => router.push(`/exame/${id}` as any);

  const renderCondicao = (c: CondicaoMedica, i: number) => {
    const sev = INFO_SEVERIDADE[c.severidade];
    const alergia = c.tipo === 'ALERGIA';
    return (
      <Animated.View key={c.id} entering={entrada(i)} exiting={FadeOut} layout={LinearTransition}>
        <ItemDeslizavel
          rotulo="Remover"
          icone="trash-can-outline"
          desativado={!edicao}
          onAcao={() => edicao?.aoRemoverCondicao(c)}
        >
          <View style={styles.fundoItem}>
            <Linha
              icone={alergia ? 'flower-pollen-outline' : 'heart-pulse'}
              cor={alergia ? colors.error : colors.success}
              fundo={alergia ? colors.errorSoft : colors.successSoft}
              principal={c.descricao}
              secundario={`Registado em ${formatarData(c.registradoEm)}`}
              direita={<Etiqueta texto={sev.label} cor={sev.cor} fundo={sev.fundo} />}
              onPress={edicao ? () => edicao.aoEditarCondicao(c) : undefined}
            />
          </View>
        </ItemDeslizavel>
      </Animated.View>
    );
  };

  const renderPrescricao = (p: Prescricao, i: number) => (
    <Animated.View key={p.id} entering={entrada(i)} exiting={FadeOut} layout={LinearTransition}>
      <ItemDeslizavel
        rotulo="Encerrar"
        icone="stop-circle-outline"
        cor={colors.warning}
        desativado={!edicao || !p.ativa}
        onAcao={() => edicao?.aoEncerrarPrescricao(p)}
      >
        <View style={styles.fundoItem}>
          <Linha
            icone="pill"
            cor={p.ativa ? colors.purple : colors.textSecondary}
            fundo={p.ativa ? colors.purpleSoft : colors.border}
            principal={p.nomeMedicamento}
            secundario={`${posologia(p)}${p.medicoNome ? `\n${p.medicoNome} · ${formatarData(p.dataPrescricao)}` : ''}`}
            onPress={edicao && p.ativa ? () => edicao.aoEditarPrescricao(p) : undefined}
          />
        </View>
      </ItemDeslizavel>
    </Animated.View>
  );

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={aAtualizar}
          onRefresh={aoAtualizar}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      {topo}

      <AbasPilula abas={ABAS} ativa={aba} onMudar={setAba} />

      {/* ---------- RESUMO ---------- */}
      {aba === 'resumo' && (
        <Animated.View key="resumo" entering={FadeInDown.duration(250)} style={styles.conteudo}>
          <View style={styles.sangue}>
            <MaterialCommunityIcons name="water" size={22} color={colors.error} />
            <Text style={styles.sangueLabel}>Tipo sanguíneo</Text>
            <Text style={styles.sangueValor}>
              {tipoSanguineo(paciente.grupoSanguineo, paciente.fatorRh)}
            </Text>
          </View>

          <View style={styles.grupo}>
            <Expansivel titulo={`Alergias (${alergias.length})`} inicialAberto>
              <View style={styles.itens}>
                {alergias.length === 0 ? <Vazio texto="Nenhuma alergia registada" /> : alergias.map(renderCondicao)}
              </View>
            </Expansivel>
          </View>

          <View style={styles.grupo}>
            <Expansivel titulo={`Condições crónicas (${cronicas.length})`} inicialAberto>
              <View style={styles.itens}>
                {cronicas.length === 0 ? <Vazio texto="Nenhuma condição registada" /> : cronicas.map(renderCondicao)}
              </View>
            </Expansivel>
          </View>

          {edicao ? (
            <BotaoAdicionar titulo="Registar condição ou alergia" onPress={edicao.aoNovaCondicao} />
          ) : null}

          <View style={styles.grupo}>
            <Expansivel titulo={`Medicação ativa (${ativas.length})`}>
              <View style={styles.itens}>
                {ativas.length === 0 ? <Vazio texto="Sem medicação ativa" /> : ativas.map(renderPrescricao)}
              </View>
            </Expansivel>
          </View>

          {edicao ? (
            <Text style={styles.dica}>
              Toque num item para editar · deslize para a esquerda para remover/encerrar
            </Text>
          ) : null}
        </Animated.View>
      )}

      {/* ---------- EXAMES ---------- */}
      {aba === 'exames' && (
        <Animated.View key="exames" entering={FadeInDown.duration(250)} style={styles.conteudo}>
          {edicao ? <BotaoAdicionar titulo="Registar exame" onPress={edicao.aoNovoExame} /> : null}
          {examesOrdenados.length === 0 ? (
            <View style={styles.grupo}>
              <Vazio texto="Ainda não há exames registados." />
            </View>
          ) : (
            examesOrdenados.map((e, i) => {
              const info = INFO_STATUS_EXAME[statusExame(e)];
              return (
                <Animated.View key={e.id} entering={entrada(i)} style={styles.cartaoItem}>
                  <Linha
                    icone="file-document-outline"
                    cor={colors.primary}
                    fundo={colors.primarySoft}
                    principal={e.tipoExame}
                    secundario={[formatarData(dataExame(e)), e.unidadeSanitariaNome].filter(Boolean).join(' · ')}
                    direita={<Etiqueta texto={info.label} cor={info.cor} fundo={info.fundo} />}
                    onPress={() => abrirExame(e.id)}
                  />
                </Animated.View>
              );
            })
          )}
        </Animated.View>
      )}

      {/* ---------- PRESCRIÇÕES ---------- */}
      {aba === 'prescricoes' && (
        <Animated.View key="prescricoes" entering={FadeInDown.duration(250)} style={styles.conteudo}>
          {edicao ? <BotaoAdicionar titulo="Nova prescrição" onPress={edicao.aoNovaPrescricao} /> : null}
          <View style={styles.grupo}>
            <Text style={styles.grupoTitulo}>Ativas</Text>
            <View style={styles.itens}>
              {ativas.length === 0 ? <Vazio texto="Sem prescrições ativas" /> : ativas.map(renderPrescricao)}
            </View>
          </View>
          {encerradas.length > 0 ? (
            <View style={styles.grupo}>
              <Expansivel titulo={`Encerradas (${encerradas.length})`}>
                <View style={styles.itens}>{encerradas.map(renderPrescricao)}</View>
              </Expansivel>
            </View>
          ) : null}
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl },
  conteudo: { marginTop: spacing.lg, gap: spacing.md },
  sangue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  sangueLabel: { flex: 1, fontFamily: fontFamily.medium, fontSize: 14, color: colors.text },
  sangueValor: { fontFamily: fontFamily.bold, fontSize: 18, color: colors.error },
  grupo: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  grupoTitulo: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  itens: { paddingBottom: spacing.sm, gap: 2 },
  fundoItem: { backgroundColor: colors.surface },
  cartaoItem: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  linhaIcone: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linhaPrincipal: { fontFamily: fontFamily.semibold, fontSize: 14, color: colors.text },
  linhaSecundaria: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
    lineHeight: 17,
  },
  adicionar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 48,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.primaryFaint,
  },
  adicionarTexto: { fontFamily: fontFamily.semibold, fontSize: 14, color: colors.primary },
  vazio: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    paddingVertical: spacing.md,
  },
  dica: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
