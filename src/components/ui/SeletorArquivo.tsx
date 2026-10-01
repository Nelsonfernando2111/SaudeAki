import { Image, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Tocavel } from '@/src/components/anim/Tocavel';
import type { ArquivoLocal } from '@/src/types';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export const TAMANHO_MAXIMO_ARQUIVO = 5 * 1024 * 1024;
export const TIPOS_ARQUIVO = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

interface Props {
  valor: ArquivoLocal | null;
  onMudar: (arquivo: ArquivoLocal | null) => void;
  /** Mensagem de validação (tipo, tamanho, permissão) */
  onErro: (mensagem: string) => void;
  desativado?: boolean;
}

function Origem({ icone, titulo, onPress }: { icone: IconName; titulo: string; onPress: () => void }) {
  return (
    <Tocavel onPress={onPress} style={styles.origem} escala={0.95}>
      <View style={styles.origemIcone}>
        <MaterialCommunityIcons name={icone} size={24} color={colors.primary} />
      </View>
      <Text style={styles.origemTexto}>{titulo}</Text>
    </Tocavel>
  );
}

/** Escolher foto (câmara ou galeria) ou PDF: JPEG, PNG, WebP ou PDF até 5 MB */
export function SeletorArquivo({ valor, onMudar, onErro, desativado }: Props) {
  function aceitar(a: ArquivoLocal) {
    if (!TIPOS_ARQUIVO.includes(a.tipo)) return onErro('Use JPEG, PNG, WebP ou PDF.');
    if (a.tamanho && a.tamanho > TAMANHO_MAXIMO_ARQUIVO) return onErro('O ficheiro é maior que 5 MB.');
    onMudar(a);
  }

  async function daImagem(camara: boolean) {
    const permissao = camara
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) return onErro('Sem permissão. Ative-a nas definições do telemóvel.');

    const opcoes: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7 };
    const r = camara ? await ImagePicker.launchCameraAsync(opcoes) : await ImagePicker.launchImageLibraryAsync(opcoes);
    if (r.canceled || !r.assets[0]) return;
    const a = r.assets[0];
    const tipo = a.mimeType ?? 'image/jpeg';
    aceitar({
      uri: a.uri,
      nome: a.fileName ?? `foto-${Date.now()}.${tipo.split('/')[1] ?? 'jpg'}`,
      tipo,
      tamanho: a.fileSize,
    });
  }

  async function doFicheiro() {
    const r = await DocumentPicker.getDocumentAsync({ type: TIPOS_ARQUIVO, copyToCacheDirectory: true });
    if (r.canceled || !r.assets[0]) return;
    const a = r.assets[0];
    aceitar({ uri: a.uri, nome: a.name, tipo: a.mimeType ?? 'application/pdf', tamanho: a.size });
  }

  if (!valor) {
    return (
      <View style={styles.origens}>
        <Origem icone="camera-outline" titulo="Câmara" onPress={() => daImagem(true)} />
        <Origem icone="image-multiple-outline" titulo="Galeria" onPress={() => daImagem(false)} />
        <Origem icone="file-pdf-box" titulo="Ficheiro" onPress={doFicheiro} />
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn} style={styles.escolhido}>
      {valor.tipo.startsWith('image/') ? (
        <Image source={{ uri: valor.uri }} style={styles.preview} />
      ) : (
        <View style={[styles.preview, styles.pdf]}>
          <MaterialCommunityIcons name="file-pdf-box" size={40} color={colors.error} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={styles.nome} numberOfLines={2}>
          {valor.nome}
        </Text>
        {valor.tamanho ? <Text style={styles.meta}>{(valor.tamanho / 1024).toFixed(0)} KB</Text> : null}
        <Tocavel onPress={() => onMudar(null)} style={styles.trocar} escala={0.95} disabled={desativado}>
          <Text style={styles.trocarTexto}>Escolher outro</Text>
        </Tocavel>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  origens: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  origem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primarySoft,
    backgroundColor: colors.primaryFaint,
  },
  origemIcone: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  origemTexto: { fontFamily: fontFamily.semibold, fontSize: 13, color: colors.primaryDark },
  escolhido: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  preview: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.background },
  pdf: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.errorSoft },
  nome: { fontFamily: fontFamily.semibold, fontSize: 14, color: colors.text },
  meta: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  trocar: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: colors.primaryFaint,
  },
  trocarTexto: { fontFamily: fontFamily.semibold, fontSize: 12, color: colors.primary },
});
