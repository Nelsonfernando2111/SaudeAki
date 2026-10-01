import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Tocavel } from '@/src/components/anim/Tocavel';
import { useTremor } from '@/src/components/anim/useTremor';
import { Alerta } from '@/src/components/ui/Alerta';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { paraErroApi } from '@/src/services/api';
import { anexarArquivo, TAMANHO_MAXIMO_ANEXO, TIPOS_ANEXO } from '@/src/services/exame.service';
import type { AnexoExame } from '@/src/types';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

interface Arquivo {
  uri: string;
  nome: string;
  tipo: string;
  tamanho?: number;
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

function BarraProgresso({ fracao }: { fracao: number }) {
  const largura = useSharedValue(0);
  useEffect(() => {
    largura.set(withTiming(fracao, { duration: 200 }));
  }, [fracao, largura]);
  const estilo = useAnimatedStyle(() => ({ width: `${largura.value * 100}%` }));
  return (
    <View style={styles.barra}>
      <Animated.View style={[styles.barraCheia, estilo]} />
    </View>
  );
}

/** Escolher foto (câmara/galeria) ou PDF e anexar a um exame (máx. 5 MB) */
export function FormAnexo({ exameId, aoAnexar }: { exameId: number; aoAnexar: (a: AnexoExame) => void }) {
  const [arquivo, setArquivo] = useState<Arquivo | null>(null);
  const [descricao, setDescricao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [progresso, setProgresso] = useState<number | null>(null);
  const { estilo, tremer } = useTremor();

  function falhar(mensagem: string) {
    setErro(mensagem);
    tremer();
  }

  function aceitar(a: Arquivo) {
    if (!TIPOS_ANEXO.includes(a.tipo)) return falhar('Use JPEG, PNG, WebP ou PDF.');
    if (a.tamanho && a.tamanho > TAMANHO_MAXIMO_ANEXO) return falhar('O ficheiro é maior que 5 MB.');
    setErro(null);
    setArquivo(a);
  }

  async function daImagem(camara: boolean) {
    const permissao = camara
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) return falhar('Sem permissão. Ative-a nas definições do telemóvel.');

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

  async function doPdf() {
    const r = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
      copyToCacheDirectory: true,
    });
    if (r.canceled || !r.assets[0]) return;
    const a = r.assets[0];
    aceitar({ uri: a.uri, nome: a.name, tipo: a.mimeType ?? 'application/pdf', tamanho: a.size });
  }

  async function enviar() {
    if (!arquivo) return;
    setErro(null);
    setProgresso(0);
    try {
      const anexo = await anexarArquivo(exameId, arquivo, descricao.trim() || undefined, setProgresso);
      aoAnexar(anexo);
    } catch (e) {
      falhar(paraErroApi(e).message);
    } finally {
      setProgresso(null);
    }
  }

  const eImagem = arquivo?.tipo.startsWith('image/');

  return (
    <Animated.View style={estilo}>
      <Alerta mensagem={erro} />

      {!arquivo ? (
        <View style={styles.origens}>
          <Origem icone="camera-outline" titulo="Câmara" onPress={() => daImagem(true)} />
          <Origem icone="image-multiple-outline" titulo="Galeria" onPress={() => daImagem(false)} />
          <Origem icone="file-pdf-box" titulo="Ficheiro" onPress={doPdf} />
        </View>
      ) : (
        <Animated.View entering={FadeIn} style={styles.escolhido}>
          {eImagem ? (
            <Image source={{ uri: arquivo.uri }} style={styles.preview} />
          ) : (
            <View style={[styles.preview, styles.pdf]}>
              <MaterialCommunityIcons name="file-pdf-box" size={40} color={colors.error} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.nome} numberOfLines={2}>
              {arquivo.nome}
            </Text>
            {arquivo.tamanho ? (
              <Text style={styles.meta}>{(arquivo.tamanho / 1024).toFixed(0)} KB</Text>
            ) : null}
            <Tocavel onPress={() => setArquivo(null)} style={styles.trocar} escala={0.95} disabled={progresso !== null}>
              <Text style={styles.trocarTexto}>Escolher outro</Text>
            </Tocavel>
          </View>
        </Animated.View>
      )}

      <Input
        label="Descrição (opcional)"
        placeholder="Ex.: Resultado digitalizado"
        value={descricao}
        onChangeText={setDescricao}
      />

      {progresso !== null ? <BarraProgresso fracao={progresso} /> : null}

      <Button
        titulo="Anexar ao exame"
        icone="paperclip"
        onPress={enviar}
        desativado={!arquivo}
        carregando={progresso !== null}
      />
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
  trocar: { alignSelf: 'flex-start', marginTop: spacing.sm, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, backgroundColor: colors.primaryFaint },
  trocarTexto: { fontFamily: fontFamily.semibold, fontSize: 12, color: colors.primary },
  barra: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden', marginBottom: spacing.md },
  barraCheia: { height: '100%', backgroundColor: colors.primary },
});
