import { useState } from 'react';
import { FlatList, Keyboard, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { SkeletonLista } from '@/src/components/anim/Skeleton';
import { Tocavel } from '@/src/components/anim/Tocavel';
import { useTremor } from '@/src/components/anim/useTremor';
import { CartaoPedido } from '@/src/components/shared/CartaoPedido';
import { Cabecalho } from '@/src/components/ui/Cabecalho';
import { Estado } from '@/src/components/ui/Estado';
import { useRecurso } from '@/src/hooks/useRecurso';
import { listarPedidos } from '@/src/services/pedido.service';
import { pacientesRecentes } from '@/src/utils/pedidos';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

const FORMATO_CODIGO = /^PAC-[A-Z0-9]{3,}$/;

export default function PesquisarPaciente() {
  const router = useRouter();
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const { estilo, tremer } = useTremor();

  // A API não tem pesquisa por nome para médicos: os "recentes" vêm dos pedidos feitos
  const recentes = useRecurso(
    () => listarPedidos({ size: 50 }).then((p) => pacientesRecentes(p.content)),
    [],
    { aoFocar: true }
  );

  function pesquisar() {
    const valor = codigo.trim().toUpperCase();
    if (!FORMATO_CODIGO.test(valor)) {
      setErro('Introduza um código válido, ex.: PAC-GN5U');
      tremer();
      return;
    }
    setErro(null);
    Keyboard.dismiss();
    router.push(`/(medico)/paciente/${valor}` as any);
  }

  return (
    <View style={styles.container}>
      <Cabecalho titulo="Pesquisar Paciente" />

      <FlatList
        data={recentes.carregando ? [] : recentes.dados ?? []}
        keyExtractor={(item) => String(item.id)}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.lista}
        refreshControl={
          <RefreshControl
            refreshing={recentes.aAtualizar}
            onRefresh={recentes.atualizar}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <View>
            <Animated.View style={[styles.pesquisa, !!erro && styles.pesquisaErro, estilo]}>
              <MaterialCommunityIcons name="card-account-details-outline" size={20} color={colors.primary} />
              <TextInput
                style={styles.input}
                placeholder="Código do paciente (PAC-XXXX)"
                placeholderTextColor={colors.textSecondary}
                value={codigo}
                onChangeText={(t) => {
                  setCodigo(t.toUpperCase());
                  setErro(null);
                }}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="search"
                onSubmitEditing={pesquisar}
              />
              <Tocavel
                style={styles.botaoPesquisa}
                onPress={pesquisar}
                corRipple="rgba(255,255,255,0.3)"
                accessibilityLabel="Pesquisar"
              >
                <MaterialCommunityIcons name="magnify" size={22} color={colors.white} />
              </Tocavel>
            </Animated.View>
            {erro ? <Text style={styles.erro}>{erro}</Text> : null}
            <Text style={styles.ajuda}>
              A ficha de emergência abre sem aprovação. O histórico completo precisa do consentimento do paciente.
            </Text>
            <Text style={styles.subtitulo}>Pacientes recentes</Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(280)}>
            <CartaoPedido pedido={item} />
          </Animated.View>
        )}
        ListEmptyComponent={
          recentes.carregando ? (
            <SkeletonLista itens={3} />
          ) : (
            <Estado
              icone="account-search-outline"
              titulo="Sem pacientes recentes"
              texto={recentes.erro?.message ?? 'Os pacientes a quem pedir acesso aparecem aqui.'}
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  lista: { padding: spacing.xl, gap: spacing.md, flexGrow: 1 },
  pesquisa: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primarySoft,
    borderRadius: radius.md,
    paddingLeft: spacing.md,
    height: 52,
    overflow: 'hidden',
  },
  pesquisaErro: { borderColor: colors.error },
  input: { flex: 1, fontFamily: fontFamily.medium, fontSize: 15, color: colors.text, letterSpacing: 0.5 },
  botaoPesquisa: {
    width: 52,
    height: '100%',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  erro: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.error, marginTop: 6 },
  ajuda: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 17 },
  subtitulo: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.xs,
  },
});
