import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AbasPilula } from '@/src/components/ui/AbasPilula';
import { Button } from '@/src/components/ui/Button';
import { obterPaciente } from '@/src/services/paciente.service';
import { temAcessoCompleto } from '@/src/services/pedido.service';
import { useSessaoStore } from '@/src/store/sessao.store';
import { formatarData } from '@/src/utils/datas';
import type { Paciente } from '@/src/types';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type Aba = 'resumo' | 'exames' | 'prescricoes';

const ABAS: { chave: Aba; titulo: string }[] = [
  { chave: 'resumo', titulo: 'Resumo' },
  { chave: 'exames', titulo: 'Exames' },
  { chave: 'prescricoes', titulo: 'Prescrições' },
];

/* ---------- Blocos reutilizáveis ---------- */

interface LinhaItemProps {
  icone: IconName;
  cor: string;
  fundo: string;
  principal: string;
  secundario?: string;
  onPress?: () => void;
}

function LinhaItem({ icone, cor, fundo, principal, secundario, onPress }: LinhaItemProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.linha, pressed && { opacity: 0.7 }]}
    >
      <View style={[styles.linhaIcone, { backgroundColor: fundo }]}>
        <MaterialCommunityIcons name={icone} size={20} color={cor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.linhaPrincipal}>{principal}</Text>
        {secundario ? <Text style={styles.linhaSecundaria}>{secundario}</Text> : null}
      </View>
      {onPress ? (
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
      ) : null}
    </Pressable>
  );
}

function Grupo({
  titulo,
  vazio,
  children,
  temItens,
}: {
  titulo: string;
  vazio: string;
  children: React.ReactNode;
  temItens: boolean;
}) {
  return (
    <View style={styles.grupo}>
      <Text style={styles.grupoTitulo}>{titulo}</Text>
      {temItens ? children : <Text style={styles.vazioTexto}>{vazio}</Text>}
    </View>
  );
}

/* ---------- Tela ---------- */

export default function HistoricoMedico() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const medico = useSessaoStore((s) => s.medico);

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [autorizado, setAutorizado] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState<Aba>('resumo');

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      if (!id) return;
      const [dados, permitido] = await Promise.all([
        obterPaciente(id),
        temAcessoCompleto(medico?.id, id),
      ]);
      if (cancelado) return;
      setPaciente(dados);
      setAutorizado(permitido);
      setCarregando(false);
    }
    carregar();
    return () => {
      cancelado = true;
    };
  }, [id, medico?.id]);

  function sair() {
    router.replace('/(medico)/(tabs)/pacientes' as any);
  }

  function abrirExame(exameId: string) {
    router.push({
      pathname: '/(medico)/exame/[id]',
      params: { id: exameId, pacienteId: id },
    } as any);
  }

  const barra = (
    <View style={[styles.barra, { paddingTop: insets.top + spacing.md }]}>
      <Pressable onPress={sair} hitSlop={12}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
      </Pressable>
      <Text style={styles.barraTitulo}>Histórico Clínico</Text>
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

  if (!paciente || !autorizado) {
    return (
      <View style={styles.container}>
        {barra}
        <View style={[styles.centro, { padding: spacing.xl, gap: spacing.sm }]}>
          <View style={styles.bloqueadoIcone}>
            <MaterialCommunityIcons name="lock-outline" size={32} color={colors.primary} />
          </View>
          <Text style={styles.bloqueadoTitulo}>
            {paciente ? 'Acesso não autorizado' : 'Paciente não encontrado'}
          </Text>
          <Text style={styles.vazioTexto}>
            {paciente
              ? 'Precisa da aprovação do paciente para ver o histórico clínico completo.'
              : 'Não foi possível carregar os dados deste paciente.'}
          </Text>
          <View style={{ alignSelf: 'stretch', marginTop: spacing.lg }}>
            <Button titulo="Voltar à pesquisa" onPress={sair} />
          </View>
        </View>
      </View>
    );
  }

  const exames = [...paciente.exames].sort((a, b) => b.data.localeCompare(a.data));

  const renderExame = (e: (typeof exames)[number]) => (
    <LinhaItem
      key={e.id}
      icone="file-document-outline"
      cor={colors.primary}
      fundo={colors.primarySoft}
      principal={e.nome}
      secundario={formatarData(e.data)}
      onPress={() => abrirExame(e.id)}
    />
  );

  const renderMedicacao = (m: Paciente['medicacaoAtiva'][number]) => (
    <LinhaItem
      key={m.id}
      icone="pill"
      cor="#7C3AED"
      fundo="#EDE9FE"
      principal={m.nome}
      secundario={m.posologia}
    />
  );

  return (
    <View style={styles.container}>
      {barra}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Identificação resumida */}
        <View style={styles.paciente}>
          <MaterialCommunityIcons name="account-circle-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.pacienteTexto}>
            {paciente.nome} · {paciente.codigo}
          </Text>
        </View>

        <AbasPilula abas={ABAS} ativa={aba} onMudar={setAba} />

        <View style={styles.conteudo}>
          {/* RESUMO */}
          {aba === 'resumo' && (
            <>
              <Grupo
                titulo="Condições médicas"
                vazio="Nenhuma condição registada"
                temItens={paciente.condicoesCronicas.length > 0}
              >
                {paciente.condicoesCronicas.map((c) => (
                  <LinhaItem
                    key={c.id}
                    icone="heart-pulse"
                    cor={colors.primary}
                    fundo={colors.primarySoft}
                    principal={c.nome}
                    secundario={c.desde ? `Desde: ${c.desde}` : undefined}
                  />
                ))}
              </Grupo>

              <Grupo
                titulo="Alergias"
                vazio="Nenhuma alergia registada"
                temItens={paciente.alergias.length > 0}
              >
                {paciente.alergias.map((a) => (
                  <LinhaItem
                    key={a.id}
                    icone="flower-pollen-outline"
                    cor={colors.error}
                    fundo={colors.errorSoft}
                    principal={a.nome}
                    secundario={a.desde ? `Desde: ${a.desde}` : undefined}
                  />
                ))}
              </Grupo>

              <Grupo titulo="Exames" vazio="Nenhum exame registado" temItens={exames.length > 0}>
                {exames.slice(0, 3).map(renderExame)}
              </Grupo>

              <Grupo
                titulo="Prescrições"
                vazio="Nenhuma prescrição ativa"
                temItens={paciente.medicacaoAtiva.length > 0}
              >
                {paciente.medicacaoAtiva.map(renderMedicacao)}
              </Grupo>
            </>
          )}

          {/* EXAMES */}
          {aba === 'exames' && (
            <Grupo titulo="Todos os exames" vazio="Nenhum exame registado" temItens={exames.length > 0}>
              {exames.map(renderExame)}
            </Grupo>
          )}

          {/* PRESCRIÇÕES */}
          {aba === 'prescricoes' && (
            <Grupo
              titulo="Prescrições ativas"
              vazio="Nenhuma prescrição ativa"
              temItens={paciente.medicacaoAtiva.length > 0}
            >
              {paciente.medicacaoAtiva.map(renderMedicacao)}
            </Grupo>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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

  paciente: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  pacienteTexto: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.textSecondary },

  conteudo: { marginTop: spacing.lg, gap: spacing.lg },
  grupo: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  grupoTitulo: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  linhaIcone: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linhaPrincipal: { fontFamily: fontFamily.medium, fontSize: 14, color: colors.text },
  linhaSecundaria: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },

  vazioTexto: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
  bloqueadoIcone: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloqueadoTitulo: { fontFamily: fontFamily.semibold, fontSize: 16, color: colors.text },
});