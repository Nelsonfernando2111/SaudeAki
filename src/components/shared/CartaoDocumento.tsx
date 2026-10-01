import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { BottomSheet } from '@/src/components/anim/BottomSheet';
import { useTremor } from '@/src/components/anim/useTremor';
import { Alerta } from '@/src/components/ui/Alerta';
import { Button } from '@/src/components/ui/Button';
import { SeletorArquivo } from '@/src/components/ui/SeletorArquivo';
import { VisualizadorImagem } from '@/src/components/ui/VisualizadorImagem';
import { useAbrirFicheiro } from '@/src/hooks/useAbrirFicheiro';
import { paraErroApi } from '@/src/services/api';
import {
  caminhoDocumentoIdentidade,
  enviarDocumentoIdentidade,
  removerDocumentoIdentidade,
} from '@/src/services/paciente.service';
import { toast } from '@/src/store/toast.store';
import { nomeTipoDocumento } from '@/src/utils/clinico';
import type { ArquivoLocal, Paciente, TipoDocumento } from '@/src/types';
import Animated from 'react-native-reanimated';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

interface Props {
  tipo?: TipoDocumento | null;
  numero?: string | null;
  /** true/false se se sabe; undefined (médico) = tentar abrir e ver */
  temFicheiro?: boolean;
  /** Médico: id/código do paciente. Paciente: omitir (usa /me) */
  pacienteId?: string;
  /** Só para o próprio paciente: permite enviar, substituir e remover */
  aoAtualizar?: (p: Paciente | null) => void;
}

export function CartaoDocumento({ tipo, numero, temFicheiro, pacienteId, aoAtualizar }: Props) {
  const { abrir, aAbrir, imagemLocal, fecharImagem } = useAbrirFicheiro();
  const [enviar, setEnviar] = useState(false);
  const [arquivo, setArquivo] = useState<ArquivoLocal | null>(null);
  const [aEnviar, setAEnviar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const { estilo, tremer } = useTremor();
  const editavel = !!aoAtualizar;

  async function confirmarEnvio() {
    if (!arquivo || !aoAtualizar) return;
    setAEnviar(true);
    setErro(null);
    try {
      aoAtualizar(await enviarDocumentoIdentidade(arquivo));
      setEnviar(false);
      setArquivo(null);
      toast.sucesso('Documento guardado');
    } catch (e) {
      setErro(paraErroApi(e).message);
      tremer();
    } finally {
      setAEnviar(false);
    }
  }

  function confirmarRemocao() {
    Alert.alert('Remover documento', 'O ficheiro é apagado. O tipo e o número continuam no perfil.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await removerDocumentoIdentidade();
            aoAtualizar?.(null);
            toast.sucesso('Ficheiro removido');
          } catch (e) {
            toast.erro(paraErroApi(e).message);
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.cartao}>
      <View style={styles.topo}>
        <View style={styles.icone}>
          <MaterialCommunityIcons name="card-account-details-outline" size={22} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.titulo}>Documento de identidade</Text>
          <Text style={styles.meta}>
            {tipo ? `${nomeTipoDocumento(tipo)} · ${numero ?? '—'}` : 'Tipo e número não indicados'}
          </Text>
          {temFicheiro !== undefined ? (
            <Text style={[styles.meta, { color: temFicheiro ? colors.success : colors.textSecondary }]}>
              {temFicheiro ? 'Ficheiro anexado' : 'Sem ficheiro anexado'}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.acoes}>
        {temFicheiro !== false ? (
          <Button
            titulo="Ver documento"
            icone="eye-outline"
            variante="secundario"
            carregando={aAbrir}
            onPress={() =>
              abrir(caminhoDocumentoIdentidade(pacienteId), 'Este paciente não tem documento anexado.')
            }
          />
        ) : null}
        {editavel ? (
          <Button
            titulo={temFicheiro ? 'Substituir ficheiro' : 'Anexar foto ou PDF'}
            icone="upload-outline"
            variante={temFicheiro ? 'secundario' : 'primario'}
            onPress={() => setEnviar(true)}
          />
        ) : null}
        {editavel && temFicheiro ? (
          <Button titulo="Remover ficheiro" variante="perigoContorno" onPress={confirmarRemocao} />
        ) : null}
      </View>

      <BottomSheet visivel={enviar} aoFechar={() => setEnviar(false)} titulo="Documento de identidade">
        <Animated.View style={estilo}>
          <Alerta mensagem={erro} />
          <SeletorArquivo
            valor={arquivo}
            onMudar={(a) => {
              setErro(null);
              setArquivo(a);
            }}
            onErro={(m) => {
              setErro(m);
              tremer();
            }}
            desativado={aEnviar}
          />
          <Button
            titulo="Guardar documento"
            icone="content-save-outline"
            onPress={confirmarEnvio}
            desativado={!arquivo}
            carregando={aEnviar}
          />
        </Animated.View>
      </BottomSheet>

      <VisualizadorImagem uri={imagemLocal} aoFechar={fecharImagem} />
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  topo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icone: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontFamily: fontFamily.semibold, fontSize: 15, color: colors.text },
  meta: { fontFamily: fontFamily.regular, fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  acoes: { gap: spacing.sm },
});
