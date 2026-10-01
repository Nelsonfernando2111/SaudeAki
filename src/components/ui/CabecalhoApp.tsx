import { Platform, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Tocavel } from '@/src/components/anim/Tocavel';
import { LogoMini } from '@/src/components/shared/LogoMini';
import { useVoltar } from '@/src/hooks/useVoltar';
import { useAvisosStore } from '@/src/store/avisos.store';
import { useSessaoStore } from '@/src/store/sessao.store';
import { Avatar } from './Avatar';
import { colors, fontFamily, spacing } from '@/src/theme';

interface CabecalhoAppProps {
  titulo?: string;
  /** Ecrãs empilhados: seta de voltar (ou início, se não houver histórico) */
  voltar?: boolean;
  /** Separador inicial: mostra o logótipo em vez do título */
  logo?: boolean;
}

/**
 * Cabeçalho genérico de toda a app (usado como `header` nos navegadores).
 * Separadores: título + sino (paciente) + avatar para o perfil.
 * Ecrãs empilhados: seta de voltar + título.
 */
export function CabecalhoApp({ titulo, voltar = false, logo = false }: CabecalhoAppProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const aoVoltar = useVoltar();
  const paciente = useSessaoStore((s) => s.paciente);
  const medico = useSessaoStore((s) => s.medico);
  const pendentes = useAvisosStore((s) => s.pedidosPendentes);

  const nome = paciente?.nomeCompleto ?? medico?.nomeCompleto;
  const rotaPerfil = paciente ? '/(paciente)/(tabs)/perfil' : '/(medico)/(tabs)/perfil';

  function abrirAvisos() {
    const p = pendentes[0];
    if (!p) {
      router.push('/(paciente)/(tabs)/acessos' as any);
      return;
    }
    router.push({
      pathname: '/(paciente)/pedido-acesso',
      params: {
        id: String(p.id),
        medicoNome: p.medicoNome,
        unidadeSanitariaNome: p.unidadeSanitariaNome ?? '',
        dataExpiracao: p.dataExpiracao,
      },
    } as any);
  }

  return (
    <View style={[styles.cabecalho, { paddingTop: insets.top + spacing.sm }]}>
      {voltar ? (
        <Tocavel
          onPress={aoVoltar}
          style={styles.botao}
          escala={0.9}
          accessibilityRole="button"
          accessibilityLabel="Voltar"
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.primary} />
        </Tocavel>
      ) : null}

      <View style={styles.centro}>
        {logo ? (
          <LogoMini />
        ) : (
          <Text style={styles.titulo} numberOfLines={1}>
            {titulo}
          </Text>
        )}
      </View>

      {!voltar ? (
        <View style={styles.acoes}>
          {paciente ? (
            <View>
              <Tocavel
                onPress={abrirAvisos}
                style={styles.botao}
                escala={0.9}
                accessibilityLabel={pendentes.length ? `${pendentes.length} pedidos pendentes` : 'Avisos'}
              >
                <MaterialCommunityIcons
                  name={pendentes.length ? 'bell-ring-outline' : 'bell-outline'}
                  size={22}
                  color={colors.primary}
                />
              </Tocavel>
              {pendentes.length ? (
                <View style={styles.contador} pointerEvents="none">
                  <Text style={styles.contadorTexto}>{pendentes.length > 9 ? '9+' : pendentes.length}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
          <Tocavel
            onPress={() => router.navigate(rotaPerfil as any)}
            style={styles.perfil}
            escala={0.9}
            accessibilityLabel="Perfil"
          >
            <Avatar nome={nome} tamanho={38} />
          </Tocavel>
        </View>
      ) : (
        <View style={styles.botaoVazio} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...Platform.select({
      ios: { shadowColor: colors.primaryDark, shadowOpacity: 0.05, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      default: {},
    }),
  },
  centro: { flex: 1 },
  titulo: { fontFamily: fontFamily.semibold, fontSize: 18, color: colors.primaryDark },
  acoes: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  botao: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoVazio: { width: 40 },
  perfil: { borderRadius: 19 },
  contador: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: colors.error,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contadorTexto: { fontFamily: fontFamily.bold, fontSize: 9, color: colors.white },
});
