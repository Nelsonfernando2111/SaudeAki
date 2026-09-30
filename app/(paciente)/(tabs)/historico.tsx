import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AbasPilula } from '@/src/components/ui/AbasPilula';
import { useSessaoStore } from '@/src/store/sessao.store';
import { formatarData } from '@/src/utils/datas';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type Aba = 'resumo' | 'exames' | 'prescricoes';

const ABAS: { chave: Aba; titulo: string }[] = [
  { chave: 'resumo', titulo: 'Resumo' },
  { chave: 'exames', titulo: 'Exames' },
  { chave: 'prescricoes', titulo: 'Prescrições' },
];

/* ---------- Blocos reutilizáveis ---------- */

interface SecaoProps {
  icone: IconName;
  cor: string;
  fundo: string;
  titulo: string;
  vazio: string;
  itens: { chave: string; principal: string; secundario?: string }[];
}

function Secao({ icone, cor, fundo, titulo, vazio, itens }: SecaoProps) {
  return (
    <View style={styles.secao}>
      <View style={[styles.secaoIcone, { backgroundColor: fundo }]}>
        <MaterialCommunityIcons name={icone} size={22} color={cor} />
      </View>
      <View style={styles.secaoCorpo}>
        <Text style={styles.secaoTitulo}>{titulo}</Text>
        {itens.length === 0 ? (
          <Text style={styles.vazioTexto}>{vazio}</Text>
        ) : (
          itens.map((item) => (
            <View key={item.chave} style={styles.item}>
              <Text style={styles.itemPrincipal}>{item.principal}</Text>
              {item.secundario ? (
                <Text style={styles.itemSecundario}>{item.secundario}</Text>
              ) : null}
            </View>
          ))
        )}
      </View>
    </View>
  );
}

function EstadoVazio({ icone, texto }: { icone: IconName; texto: string }) {
  return (
    <View style={styles.vazio}>
      <MaterialCommunityIcons name={icone} size={40} color={colors.border} />
      <Text style={styles.vazioTexto}>{texto}</Text>
    </View>
  );
}

/* ---------- Tela ---------- */

export default function Historico() {
  const insets = useSafeAreaInsets();
  const paciente = useSessaoStore((s) => s.paciente);
  const [aba, setAba] = useState<Aba>('resumo');

  if (!paciente) return null;

  const exames = [...paciente.exames].sort((a, b) => b.data.localeCompare(a.data));

  return (
    <View style={styles.container}>
      <View style={[styles.cabecalho, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.cabecalhoTitulo}>Histórico Clínico</Text>
      </View>

      <View style={styles.abas}>
        <AbasPilula abas={ABAS} ativa={aba} onMudar={setAba} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* RESUMO */}
        {aba === 'resumo' && (
          <View style={styles.lista}>
            <Secao
              icone="heart-pulse"
              cor={colors.success}
              fundo={colors.successSoft}
              titulo="Condições médicas"
              vazio="Nenhuma condição registada"
              itens={paciente.condicoesCronicas.map((c) => ({
                chave: c.id,
                principal: c.nome,
                secundario: c.desde ? `Desde: ${c.desde}` : undefined,
              }))}
            />
            <Secao
              icone="flower-pollen-outline"
              cor={colors.warning}
              fundo={colors.warningSoft}
              titulo="Alergias"
              vazio="Nenhuma alergia registada"
              itens={paciente.alergias.map((a) => ({
                chave: a.id,
                principal: a.nome,
                secundario: a.desde ? `Desde: ${a.desde}` : undefined,
              }))}
            />
            <Secao
              icone="flask-outline"
              cor={colors.primary}
              fundo={colors.primarySoft}
              titulo="Exames recentes"
              vazio="Nenhum exame registado"
              itens={exames.slice(0, 3).map((e) => ({
                chave: e.id,
                principal: e.nome,
                secundario: formatarData(e.data),
              }))}
            />
            <Secao
              icone="pill"
              cor="#7C3AED"
              fundo="#EDE9FE"
              titulo="Prescrições ativas"
              vazio="Nenhuma prescrição ativa"
              itens={paciente.medicacaoAtiva.map((m) => ({
                chave: m.id,
                principal: m.nome,
                secundario: m.posologia,
              }))}
            />
          </View>
        )}

        {/* EXAMES */}
        {aba === 'exames' &&
          (exames.length === 0 ? (
            <EstadoVazio icone="flask-empty-outline" texto="Ainda não tem exames registados." />
          ) : (
            <View style={styles.lista}>
              {exames.map((e) => (
                <View key={e.id} style={styles.linhaCartao}>
                  <View style={[styles.secaoIcone, { backgroundColor: colors.primarySoft }]}>
                    <MaterialCommunityIcons
                      name="file-document-outline"
                      size={22}
                      color={colors.primary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemPrincipal}>{e.nome}</Text>
                    <Text style={styles.itemSecundario}>
                      {formatarData(e.data)}
                      {e.laboratorio ? ` · ${e.laboratorio}` : ''}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ))}

        {/* PRESCRIÇÕES */}
        {aba === 'prescricoes' &&
          (paciente.medicacaoAtiva.length === 0 ? (
            <EstadoVazio icone="pill-off" texto="Não tem prescrições ativas." />
          ) : (
            <View style={styles.lista}>
              {paciente.medicacaoAtiva.map((m) => (
                <View key={m.id} style={styles.linhaCartao}>
                  <View style={[styles.secaoIcone, { backgroundColor: '#EDE9FE' }]}>
                    <MaterialCommunityIcons name="pill" size={22} color="#7C3AED" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemPrincipal}>{m.nome}</Text>
                    <Text style={styles.itemSecundario}>{m.posologia}</Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  cabecalho: {
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    paddingBottom: spacing.lg,
  },
  cabecalhoTitulo: { fontFamily: fontFamily.semibold, fontSize: 18, color: colors.white },
  abas: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxl },
  lista: { gap: spacing.md },

  secao: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  secaoIcone: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secaoCorpo: { flex: 1 },
  secaoTitulo: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  item: { marginTop: 4 },
  itemPrincipal: { fontFamily: fontFamily.semibold, fontSize: 15, color: colors.text },
  itemSecundario: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1,
  },

  linhaCartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },

  vazio: { alignItems: 'center', gap: spacing.sm, marginTop: spacing.xxl },
  vazioTexto: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.textSecondary },
});