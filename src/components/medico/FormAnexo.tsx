import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useTremor } from '@/src/components/anim/useTremor';
import { Alerta } from '@/src/components/ui/Alerta';
import { Button } from '@/src/components/ui/Button';
import { Input } from '@/src/components/ui/Input';
import { SeletorArquivo } from '@/src/components/ui/SeletorArquivo';
import { paraErroApi } from '@/src/services/api';
import { anexarArquivo } from '@/src/services/exame.service';
import type { AnexoExame, ArquivoLocal } from '@/src/types';
import { colors, spacing } from '@/src/theme';

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
  const [arquivo, setArquivo] = useState<ArquivoLocal | null>(null);
  const [descricao, setDescricao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [progresso, setProgresso] = useState<number | null>(null);
  const { estilo, tremer } = useTremor();

  function falhar(mensagem: string) {
    setErro(mensagem);
    tremer();
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

  return (
    <Animated.View style={estilo}>
      <SeletorArquivo
        valor={arquivo}
        onMudar={(a) => {
          setErro(null);
          setArquivo(a);
        }}
        onErro={falhar}
        desativado={progresso !== null}
      />
      <Input
        label="Descrição (opcional)"
        placeholder="Ex.: Resultado digitalizado"
        value={descricao}
        onChangeText={setDescricao}
      />
      {progresso !== null ? <BarraProgresso fracao={progresso} /> : null}
      <Alerta mensagem={erro} />
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
  barra: { height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: 'hidden', marginBottom: spacing.md },
  barraCheia: { height: '100%', backgroundColor: colors.primary },
});
