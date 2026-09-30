import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { obterPaciente } from '@/src/services/paciente.service';
import { useSessaoStore } from '@/src/store/sessao.store';
import { obterSessao } from '@/src/utils/sessao';
import { colors, fontFamily, radius, spacing } from '@/src/theme';
import { criarPedidoDemo } from '@/src/services/pedido.service';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface CartaoResumoProps {
  icone: IconName;
  cor: string;
  fundo: string;
  titulo: string;
  detalhe: string;
  onPress?: () => void;
}

function CartaoResumo({ icone, cor, fundo, titulo, detalhe, onPress }: CartaoResumoProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cartaoResumo, pressed && { opacity: 0.85 }]}
    >
      <View style={[styles.cartaoIcone, { backgroundColor: fundo }]}>
        <MaterialCommunityIcons name={icone} size={22} color={cor} />
      </View>
      <Text style={styles.cartaoTitulo}>{titulo}</Text>
      <Text style={styles.cartaoDetalhe}>{detalhe}</Text>
    </Pressable>
  );
}

const plural = (n: number, singular: string, pluralTxt: string) =>
  `${n} ${n === 1 ? singular : pluralTxt}`;

export default function HomePaciente() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const paciente = useSessaoStore((s) => s.paciente);
  const definirPaciente = useSessaoStore((s) => s.definirPaciente);
  const sair = useSessaoStore((s) => s.sair);
  const [copiado, setCopiado] = useState(false);

  // Recarrega o paciente (útil quando a app reabre com sessão guardada)
  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      const sessao = await obterSessao();
      if (!sessao?.id) {
        if (!paciente) {
          await sair();
          router.replace('/(auth)/escolher-perfil' as any);
        }
        return;
      }
      const dados = await obterPaciente(sessao.id);
      if (cancelado) return;
      if (dados) {
        definirPaciente(dados);
      } else if (!paciente) {
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

  async function copiarCodigo() {
    if (!paciente) return;
    await Clipboard.setStringAsync(paciente.codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  if (!paciente) {
    return (
      <View style={styles.carregando}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const primeiroNome = paciente.nome.split(' ')[0];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Cabeçalho azul */}
        <View style={[styles.cabecalho, { paddingTop: insets.top + spacing.lg }]}>
          <Text style={styles.saudacao}>Olá, {primeiroNome} 👋</Text>
          <Text style={styles.subSaudacao}>Aqui está um resumo da sua saúde</Text>
        </View>

        {/* Código único (sobreposto ao cabeçalho) */}
        <View style={styles.cartaoCodigo}>
          <View>
            <Text style={styles.codigoLabel}>Código único</Text>
            <Text style={styles.codigoValor}>{paciente.codigo}</Text>
          </View>
          <Pressable
            onPress={copiarCodigo}
            hitSlop={10}
            style={[styles.botaoCopiar, copiado && { backgroundColor: colors.successSoft }]}
            accessibilityLabel="Copiar código"
          >
            <MaterialCommunityIcons
              name={copiado ? 'check' : 'content-copy'}
              size={20}
              color={copiado ? colors.success : colors.primary}
            />
          </Pressable>
        </View>

        {/* Grelha de resumo */}
        <View style={styles.grelha}>
          <CartaoResumo
            icone="flower-pollen-outline"
            cor={colors.error}
            fundo={colors.errorSoft}
            titulo="Alergias"
            detalhe={plural(paciente.alergias.length, 'registada', 'registadas')}
            onPress={() => router.push('/(paciente)/(tabs)/historico' as any)}
          />
          <CartaoResumo
            icone="shield-half-full"
            cor={colors.success}
            fundo={colors.successSoft}
            titulo="Condições crónicas"
            detalhe={plural(paciente.condicoesCronicas.length, 'registada', 'registadas')}
            onPress={() => router.push('/(paciente)/(tabs)/historico' as any)}
          />
          <CartaoResumo
            icone="pill"
            cor={colors.primary}
            fundo={colors.primarySoft}
            titulo="Medicação ativa"
            detalhe={plural(paciente.medicacaoAtiva.length, 'medicamento', 'medicamentos')}
            onPress={() => router.push('/(paciente)/(tabs)/historico' as any)}
          />
          <CartaoResumo
            icone="flask-outline"
            cor={colors.primary}
            fundo={colors.primarySoft}
            titulo="Últimos exames"
            detalhe={plural(paciente.exames.length, 'recente', 'recentes')}
            onPress={() => router.push('/(paciente)/(tabs)/historico' as any)}
          />
        </View>

        {/* Banner */}
        <Pressable
          style={styles.banner}
          onPress={() => router.push('/(paciente)/(tabs)/perfil' as any)}
        >
          <Text style={styles.bannerTexto}>
            Mantenha seus dados atualizados para um melhor atendimento.
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color={colors.white} />
        </Pressable>
                {/* DEMO: remover quando houver notificações reais */}
        <Pressable
          style={styles.demo}
          onPress={() =>
            router.push({
              pathname: '/(paciente)/pedido-acesso',
              params: { id: criarPedidoDemo(paciente) },
            } as any)
          }
        >
          <MaterialCommunityIcons name="bell-ring-outline" size={18} color={colors.primary} />
          <Text style={styles.demoTexto}>Simular pedido de acesso (demo)</Text>
        </Pressable>
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
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingBottom: 64,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  saudacao: { fontFamily: fontFamily.semibold, fontSize: 24, color: colors.white },
  subSaudacao: {
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  cartaoCodigo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.xl,
    marginTop: -40,
    padding: spacing.lg,
    borderRadius: radius.lg,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  codigoLabel: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.textSecondary },
  codigoValor: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    color: colors.text,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  botaoCopiar: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grelha: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  cartaoResumo: {
    width: '48%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cartaoIcone: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  cartaoTitulo: { fontFamily: fontFamily.semibold, fontSize: 14, color: colors.text },
  cartaoDetalhe: {
    fontFamily: fontFamily.regular,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primary,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  bannerTexto: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.white,
    lineHeight: 20,
  },
    demo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
  },
  demoTexto: { fontFamily: fontFamily.medium, fontSize: 13, color: colors.primary },
});