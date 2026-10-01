import { useEffect, useState } from 'react';
import { Image, Modal, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { cabecalhoAutorizacao } from '@/src/services/api';
import { spacing } from '@/src/theme';

/** Imagem em ecrã inteiro, pedida com o token (toque para fechar) */
export function VisualizadorImagem({ uri, aoFechar }: { uri: string | null; aoFechar: () => void }) {
  const [cabecalhos, setCabecalhos] = useState<Record<string, string>>({});

  useEffect(() => {
    cabecalhoAutorizacao().then(setCabecalhos);
  }, [uri]);

  return (
    <Modal visible={!!uri} transparent animationType="fade" onRequestClose={aoFechar}>
      <Pressable style={styles.fundo} onPress={aoFechar} accessibilityLabel="Fechar">
        {uri ? (
          <Animated.View entering={FadeIn} style={{ flex: 1, alignSelf: 'stretch' }}>
            <Image source={{ uri, headers: cabecalhos }} style={{ flex: 1 }} resizeMode="contain" />
          </Animated.View>
        ) : null}
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
});
