import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { pesquisarPacientes } from '@/src/services/paciente.service';
import type { Paciente } from '@/src/types';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

export default function PesquisarPaciente() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [termo, setTermo] = useState('');
  const [resultados, setResultados] = useState<Paciente[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);

    const timer = setTimeout(async () => {
      const dados = await pesquisarPacientes(termo);
      if (cancelado) return;
      setResultados(dados);
      setCarregando(false);
    }, 400);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [termo]);

  function abrirPaciente(id: string) {
    Keyboard.dismiss();
    router.push(`/(medico)/paciente/${id}` as any);
  }

  const temTermo = termo.trim().length > 0;

  return (
    <View style={styles.container}>
      <View style={[styles.cabecalho, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.cabecalhoTitulo}>Pesquisar Paciente</Text>
      </View>

      <View style={styles.corpo}>
        {/* Campo de pesquisa */}
        <View style={styles.pesquisa}>
          <TextInput
            style={styles.input}
            placeholder="Digite aqui o código do paciente"
            placeholderTextColor={colors.textSecondary}
            value={termo}
            onChangeText={setTermo}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={Keyboard.dismiss}
          />
          <Pressable style={styles.botaoPesquisa} onPress={Keyboard.dismiss} accessibilityLabel="Pesquisar">
            <MaterialCommunityIcons name="magnify" size={22} color={colors.white} />
          </Pressable>
        </View>

        <Text style={styles.subtitulo}>{temTermo ? 'Resultados' : 'Resultados recentes'}</Text>

        {carregando ? (
          <View style={styles.centro}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={resultados}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.lista}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => abrirPaciente(item.id)}
                style={({ pressed }) => [styles.cartao, pressed && { opacity: 0.8 }]}
              >
                <View style={styles.avatar}>
                  <MaterialCommunityIcons name="account" size={24} color={colors.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.codigo}>{item.codigo}</Text>
                  <Text style={styles.nome}>{item.nome}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.vazio}>
                <MaterialCommunityIcons name="account-search-outline" size={44} color={colors.border} />
                <Text style={styles.vazioTitulo}>Nenhum paciente encontrado</Text>
                <Text style={styles.vazioTexto}>
                  Confirme o código (ex.: IDCLIN-4F9T2) ou o nome e tente de novo.
                </Text>
              </View>
            }
          />
        )}
      </View>
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
  corpo: { flex: 1, padding: spacing.xl },
  pesquisa: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingLeft: spacing.md,
    height: 50,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.regular,
    fontSize: 14,
    color: colors.text,
  },
  botaoPesquisa: {
    width: 50,
    height: '100%',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitulo: {
    fontFamily: fontFamily.semibold,
    fontSize: 15,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  centro: { marginTop: spacing.xxl, alignItems: 'center' },
  lista: { gap: spacing.md, paddingBottom: spacing.xxl },
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codigo: { fontFamily: fontFamily.semibold, fontSize: 14, color: colors.text },
  nome: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.textSecondary, marginTop: 1 },
  vazio: { alignItems: 'center', marginTop: 60, gap: spacing.sm, paddingHorizontal: spacing.xl },
  vazioTitulo: { fontFamily: fontFamily.semibold, fontSize: 16, color: colors.text },
  vazioTexto: {
    fontFamily: fontFamily.regular,
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
});