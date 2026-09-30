import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { LogoMini } from '@/src/components/shared/LogoMini';
import { listarConsultasMedico } from '@/src/services/acesso.service';
import { obterMedico } from '@/src/services/medico.service';
import { listarPedidosMedico } from '@/src/services/pedido.service';
import { useSessaoStore } from '@/src/store/sessao.store';
import { formatarDiaRelativo, formatarHora } from '@/src/utils/datas';
import { estadoEfetivo } from '@/src/utils/pedidos';
import { obterSessao } from '@/src/utils/sessao';
import type { Consulta, PedidoAcesso } from '@/src/types';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

const ROXO = '#7C3AED';
const ROXO_SUAVE = '#EDE9FE';
const AMBAR = '#B45309';

/* ---------- Blocos ---------- */

function Avatar({ tamanho = 40 }: { tamanho?: number }) {
  return (
    <View
      style={{
        width: tamanho,
        height: tamanho,
        borderRadius: tamanho / 2,
        backgroundColor: colors.primarySoft,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <MaterialCommunityIcons name="account" size={tamanho * 0.6} color={colors.primary} />
    </View>
  );
}

function CabecalhoSecao({ titulo, onVerTodos }: { titulo: string; onVerTodos?: () => void }) {
  return (
    <View style={styles.secaoCabecalho}>
      <Text style={styles.secaoTitulo}>{titulo}</Text>
      {onVerTodos ? (
        <Pressable onPress={onVerTodos} hitSlop={8} style={styles.verTodos}>
          <Text style={styles.verTodosTexto}>Ver todos</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

function Atalho({
  icone,
  cor,
  fundo,
  titulo,
  detalhe,
  contador,
  onPress,
}: {
  icone: IconName;
  cor: string;
  fundo: string;
  titulo: string;
  detalhe: string;
  contador?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.atalho, { backgroundColor: fundo }, pressed && { opacity: 0.8 }]}
    >
      <View style={styles.atalhoIconeLinha}>
        <MaterialCommunityIcons name={icone} size={28} color={cor} />
        {contador ? (
          <View style={styles.contador}>
            <Text style={styles.contadorTexto}>{contador}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.atalhoTitulo, { color: cor === colors.primary ? colors.text : cor }]}>
        {titulo}
      </Text>
      <Text style={styles.atalhoDetalhe}>{detalhe}</Text>
    </Pressable>
  );
}

function Etiqueta({ texto, cor, fundo }: { texto: string; cor: string; fundo: string }) {
  return (
    <View style={[styles.etiqueta, { backgroundColor: fundo }]}>
      <Text style={[styles.etiquetaTexto, { color: cor }]}>{texto}</Text>
    </View>
  );
}

/* ---------- Tela ---------- */

export default function InicioMedico() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const medico = useSessaoStore((s) => s.medico);
  const definirMedico = useSessaoStore((s) => s.definirMedico);
  const sair = useSessaoStore((s) => s.sair);

  const [pedidos, setPedidos] = useState<PedidoAcesso[]>([]);
  const [consultas, setConsultas] = useState<Consulta[]>([]);

  // Recarrega o médico quando a app reabre com sessão guardada
  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      if (medico) return;
      const sessao = await obterSessao();
      const dados = sessao?.id ? await obterMedico(sessao.id) : null;
      if (cancelado) return;
      if (dados) {
        definirMedico(dados);
      } else {
        await sair();
        router.replace('/(auth)/escolher-perfil' as any);
      }
    }
    carregar();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recarrega os dados sempre que o separador ganha foco
  useFocusEffect(
    useCallback(() => {
      let cancelado = false;
      async function carregar() {
        if (!medico) return;
        const [p, c] = await Promise.all([
          listarPedidosMedico(medico.id),
          listarConsultasMedico(medico.id),
        ]);
        if (cancelado) return;
        setPedidos(p);
        setConsultas(c);
      }
      carregar();
      return () => {
        cancelado = true;
      };
    }, [medico])
  );

  if (!medico) {
    return (
      <View style={styles.carregando}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const pendentes = pedidos.filter((p) => estadoEfetivo(p) === 'pendente');
  const irPara = (rota: string) => router.push(rota as any);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Cabeçalho */}
        <View style={[styles.cabecalho, { paddingTop: insets.top + spacing.md }]}>
          <View style={styles.topo}>
            <LogoMini />
            <Pressable
              onPress={() => irPara('/(medico)/(tabs)/pedidos')}
              hitSlop={10}
              accessibilityLabel="Notificações"
            >
              <MaterialCommunityIcons name="bell-outline" size={28} color={colors.white} />
              {pendentes.length > 0 ? (
                <View style={styles.sinoContador}>
                  <Text style={styles.contadorTexto}>{pendentes.length}</Text>
                </View>
              ) : null}
            </Pressable>
          </View>

          <View style={styles.medico}>
            <Avatar tamanho={64} />
            <View style={{ flex: 1 }}>
              <Text style={styles.saudacao}>Olá, {medico.nome}</Text>
              <Text style={styles.medicoMeta}>
                Médico{medico.especialidade ? ` · ${medico.especialidade}` : ''}
              </Text>
              <Text style={styles.medicoMeta}>{medico.unidadeSanitaria}</Text>
            </View>
          </View>
        </View>

        {/* Folha branca */}
        <View style={styles.folha}>
          {/* Pesquisar paciente */}
          <Pressable
            onPress={() => irPara('/(medico)/(tabs)/pacientes')}
            style={({ pressed }) => [styles.pesquisa, pressed && { opacity: 0.85 }]}
          >
            <View style={styles.pesquisaIcone}>
              <MaterialCommunityIcons name="magnify" size={28} color={colors.white} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.pesquisaTitulo}>Pesquisar paciente</Text>
              <Text style={styles.pesquisaTexto}>
                Introduza o código único do paciente para aceder aos dados.
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={22} color={colors.primary} />
          </Pressable>

          {/* Acesso rápido */}
          <Text style={[styles.secaoTitulo, styles.blocoTitulo]}>Acesso rápido</Text>
          <View style={styles.atalhos}>
            <Atalho
              icone="account-outline"
              cor={colors.primary}
              fundo={colors.primarySoft}
              titulo="Pacientes"
              detalhe="Pesquisar & ver dados"
              onPress={() => irPara('/(medico)/(tabs)/pacientes')}
            />
            <Atalho
              icone="file-document-outline"
              cor={colors.success}
              fundo={colors.successSoft}
              titulo="Pedidos de acesso"
              detalhe="Ver pedidos pendentes"
              contador={pendentes.length}
              onPress={() => irPara('/(medico)/(tabs)/pedidos')}
            />
            <Atalho
              icone="account-circle-outline"
              cor={ROXO}
              fundo={ROXO_SUAVE}
              titulo="Perfil"
              detalhe="Ver/atualizar seus dados"
              onPress={() => irPara('/(medico)/(tabs)/perfil')}
            />
          </View>

          {/* Pedidos pendentes */}
          <CabecalhoSecao
            titulo="Pedidos pendentes"
            onVerTodos={() => irPara('/(medico)/(tabs)/pedidos')}
          />
          <View style={styles.cartaoLista}>
            {pendentes.length === 0 ? (
              <Text style={styles.vazio}>Não tem pedidos pendentes.</Text>
            ) : (
              pendentes.slice(0, 2).map((p, i, arr) => (
                <Pressable
                  key={p.id}
                  onPress={() =>
                    router.push({
                      pathname: '/(medico)/aguardando-aprovacao',
                      params: { id: p.id },
                    } as any)
                  }
                  style={({ pressed }) => [
                    styles.item,
                    i < arr.length - 1 && styles.itemSeparador,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Avatar />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemNome}>{p.paciente.nome}</Text>
                    <Text style={styles.itemMeta}>
                      {p.paciente.codigo} · {p.medico.unidadeSanitaria}
                    </Text>
                    <Text style={styles.itemMeta}>Solicitado às {formatarHora(p.criadoEm)}</Text>
                  </View>
                  <Etiqueta texto="Pendente" cor={AMBAR} fundo={colors.warningSoft} />
                </Pressable>
              ))
            )}
          </View>

          {/* Últimos pacientes consultados */}
          <CabecalhoSecao
            titulo="Últimos pacientes consultados"
            onVerTodos={() => irPara('/(medico)/(tabs)/pacientes')}
          />
          <View style={styles.cartaoLista}>
            {consultas.length === 0 ? (
              <Text style={styles.vazio}>Ainda não consultou nenhum paciente.</Text>
            ) : (
              consultas.slice(0, 2).map((c, i, arr) => (
                <Pressable
                  key={c.id}
                  onPress={() => irPara(`/(medico)/paciente/${c.paciente.id}`)}
                  style={({ pressed }) => [
                    styles.item,
                    i < arr.length - 1 && styles.itemSeparador,
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Avatar />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemNome}>{c.paciente.nome}</Text>
                    <Text style={styles.itemMeta}>
                      {c.paciente.codigo} · {medico.unidadeSanitaria}
                    </Text>
                    <Text style={styles.itemMeta}>{formatarDiaRelativo(c.data)}</Text>
                  </View>
                  {c.tipo === 'emergencia' ? (
                    <Etiqueta texto="Emergência" cor={colors.primary} fundo={colors.primarySoft} />
                  ) : (
                    <Etiqueta texto="Histórico completo" cor={ROXO} fundo={ROXO_SUAVE} />
                  )}
                </Pressable>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xxl },
  carregando: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },

  cabecalho: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: spacing.xl,
    paddingBottom: 48,
  },
  topo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sinoContador: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contador: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -6,
    marginTop: -8,
  },
  contadorTexto: { fontFamily: fontFamily.bold, fontSize: 10, color: colors.white },
  medico: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.xl },
  saudacao: { fontFamily: fontFamily.semibold, fontSize: 20, color: colors.white },
  medicoMeta: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
  },

  folha: {
    backgroundColor: colors.background,
    marginTop: -24,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },

  pesquisa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  pesquisaIcone: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pesquisaTitulo: { fontFamily: fontFamily.semibold, fontSize: 16, color: colors.text },
  pesquisaTexto: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },

  secaoTitulo: { fontFamily: fontFamily.semibold, fontSize: 16, color: colors.text },
  blocoTitulo: { marginTop: spacing.xl, marginBottom: spacing.md },
  secaoCabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  verTodos: { flexDirection: 'row', alignItems: 'center' },
  verTodosTexto: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.primary },

  atalhos: { flexDirection: 'row', gap: spacing.md },
  atalho: { flex: 1, borderRadius: radius.lg, padding: spacing.md, minHeight: 112 },
  atalhoIconeLinha: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  atalhoTitulo: { fontFamily: fontFamily.semibold, fontSize: 13 },
  atalhoDetalhe: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },

  cartaoLista: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  itemSeparador: { borderBottomWidth: 1, borderBottomColor: colors.border },
  itemNome: { fontFamily: fontFamily.semibold, fontSize: 14, color: colors.text },
  itemMeta: {
    fontFamily: fontFamily.regular,
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  etiqueta: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  etiquetaTexto: { fontFamily: fontFamily.medium, fontSize: 11 },
  vazio: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});