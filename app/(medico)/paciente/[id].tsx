import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { AbasPilula } from '@/src/components/ui/AbasPilula';
import { Button } from '@/src/components/ui/Button';
import { obterPaciente } from '@/src/services/paciente.service';
import { solicitarAcesso } from '@/src/services/pedido.service';
import { useSessaoStore } from '@/src/store/sessao.store';
import type { Paciente } from '@/src/types';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];
type Aba = 'resumo' | 'historico' | 'prescricoes';

const ABAS: { chave: Aba; titulo: string }[] = [
  { chave: 'resumo', titulo: 'Resumo' },
  { chave: 'historico', titulo: 'Histórico' },
  { chave: 'prescricoes', titulo: 'Prescrições' },
];

function LinhaResumo({
  icone,
  cor,
  fundo,
  titulo,
  valor,
}: {
  icone: IconName;
  cor: string;
  fundo: string;
  titulo: string;
  valor: string;
}) {
  return (
    <View style={styles.linha}>
      <View style={[styles.linhaIcone, { backgroundColor: fundo }]}>
        <MaterialCommunityIcons name={icone} size={22} color={cor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.linhaTitulo}>{titulo}</Text>
        <Text style={styles.linhaValor}>{valor}</Text>
      </View>
    </View>
  );
}

export default function DadosPaciente() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const medico = useSessaoStore((s) => s.medico);

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [aba, setAba] = useState<Aba>('resumo');
  const [aSolicitar, setASolicitar] = useState(false);

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      if (!id) return;
      const dados = await obterPaciente(id);
      if (cancelado) return;
      setPaciente(dados);
      setCarregando(false);
    }
    carregar();
    return () => {
      cancelado = true;
    };
  }, [id]);

  async function pedirAcesso() {
    if (!paciente || !medico) return;
    setASolicitar(true);
    try {
      const pedido = await solicitarAcesso(medico, paciente);
      router.push({
        pathname: '/(medico)/aguardando-aprovacao',
        params: { id: pedido.id },
      } as any);
    } finally {
      setASolicitar(false);
    }
  }

  const cabecalhoBarra = (titulo: string) => (
    <View style={[styles.barra, { paddingTop: insets.top + spacing.md }]}>
      <Pressable onPress={() => router.back()} hitSlop={12}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.white} />
      </Pressable>
      <Text style={styles.barraTitulo}>{titulo}</Text>
      <View style={{ width: 24 }} />
    </View>
  );

  if (carregando) {
    return (
      <View style={styles.container}>
        {cabecalhoBarra('Dados do Paciente')}
        <View style={styles.centro}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!paciente) {
    return (
      <View style={styles.container}>
        {cabecalhoBarra('Dados do Paciente')}
        <View style={styles.centro}>
          <Text style={styles.vazioTexto}>Paciente não encontrado.</Text>
        </View>
      </View>
    );
  }

  const lista = (nomes: string[], vazio: string) => (nomes.length ? nomes.join(', ') : vazio);

  return (
    <View style={styles.container}>
      {cabecalhoBarra('Dados do Paciente')}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Identificação */}
        <View style={styles.identificacao}>
          <View style={styles.avatar}>
            <MaterialCommunityIcons name="account" size={40} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.nome}>{paciente.nome}</Text>
            <Text style={styles.codigo}>{paciente.codigo}</Text>
            <View
              style={[
                styles.badge,
                { backgroundColor: paciente.ativo ? colors.successSoft : colors.errorSoft },
              ]}
            >
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={13}
                color={paciente.ativo ? colors.success : colors.error}
              />
              <Text
                style={[
                  styles.badgeTexto,
                  { color: paciente.ativo ? colors.success : colors.error },
                ]}
              >
                {paciente.ativo ? 'Ativo' : 'Inativo'}
              </Text>
            </View>
          </View>
        </View>

        <AbasPilula abas={ABAS} ativa={aba} onMudar={setAba} />

        <View style={styles.conteudo}>
          {aba === 'resumo' ? (
            <View style={styles.cartao}>
              <LinhaResumo
                icone="water-outline"
                cor={colors.error}
                fundo={colors.errorSoft}
                titulo="Tipo sanguíneo"
                valor={paciente.tipoSanguineo}
              />
              <LinhaResumo
                icone="flower-pollen-outline"
                cor={colors.error}
                fundo={colors.errorSoft}
                titulo="Alergias"
                valor={lista(
                  paciente.alergias.map((a) => a.nome),
                  'Nenhuma registada'
                )}
              />
              <LinhaResumo
                icone="heart-pulse"
                cor={colors.primary}
                fundo={colors.primarySoft}
                titulo="Condições crónicas"
                valor={lista(
                  paciente.condicoesCronicas.map((c) => c.nome),
                  'Nenhuma registada'
                )}
              />
              <LinhaResumo
                icone="pill"
                cor={colors.success}
                fundo={colors.successSoft}
                titulo="Medicação ativa"
                valor={lista(
                  paciente.medicacaoAtiva.map((m) => m.nome),
                  'Nenhuma registada'
                )}
              />
            </View>
          ) : (
            <View style={styles.bloqueado}>
              <View style={styles.bloqueadoIcone}>
                <MaterialCommunityIcons name="lock-outline" size={32} color={colors.primary} />
              </View>
              <Text style={styles.bloqueadoTitulo}>Acesso restrito</Text>
              <Text style={styles.vazioTexto}>
                Para ver {aba === 'historico' ? 'o histórico clínico' : 'as prescrições'} completo, o
                paciente precisa de aprovar o seu pedido de acesso.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Ação fixa no fundo */}
      <View style={[styles.rodape, { paddingBottom: insets.bottom + spacing.lg }]}>
        <Button
          titulo="Solicitar acesso completo"
          onPress={pedirAcesso}
          carregando={aSolicitar}
          desativado={!medico}
        />
      </View>
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

  identificacao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nome: { fontFamily: fontFamily.semibold, fontSize: 18, color: colors.text },
  codigo: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
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

  conteudo: { marginTop: spacing.lg },
  cartao: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  linhaIcone: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linhaTitulo: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textSecondary },
  linhaValor: { fontFamily: fontFamily.semibold, fontSize: 15, color: colors.text, marginTop: 1 },

  bloqueado: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
  },
  bloqueadoIcone: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  bloqueadoTitulo: { fontFamily: fontFamily.semibold, fontSize: 16, color: colors.text },
  vazioTexto: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },

  rodape: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});