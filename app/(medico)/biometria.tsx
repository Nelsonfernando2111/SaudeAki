import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Button } from '@/src/components/ui/Button';
import { Etiqueta } from '@/src/components/ui/Etiqueta';
import { useVoltar } from '@/src/hooks/useVoltar';
import { comCabecalho } from '@/src/utils/navegacao';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

type Modo = 'digital' | 'facial';

const CONTEUDO: Record<
  Modo,
  { titulo: string; icone: React.ComponentProps<typeof MaterialCommunityIcons>['name']; instrucao: string; texto: string }
> = {
  digital: {
    titulo: 'Impressão digital',
    icone: 'fingerprint',
    instrucao: 'Peça ao paciente para colocar o dedo no leitor',
    texto:
      'Para pacientes que não conseguem dizer o seu código único (inconscientes, confusos ou sem documentos), o médico poderá identificá-los pela impressão digital e abrir logo a ficha de emergência.',
  },
  facial: {
    titulo: 'Reconhecimento facial',
    icone: 'face-recognition',
    instrucao: 'Aponte a câmara para o rosto do paciente',
    texto:
      'O reconhecimento facial (Face ID) permitirá identificar o paciente com a câmara do telemóvel quando ele não puder fornecer o código único.',
  },
};

/** Proposta: identificação biométrica do paciente (ainda não funcional) */
export default function IdentificacaoBiometrica() {
  const insets = useSafeAreaInsets();
  const voltar = useVoltar('/(medico)/(tabs)/pacientes');
  const { modo: modoParam } = useLocalSearchParams<{ modo?: Modo }>();
  const modo: Modo = modoParam === 'facial' ? 'facial' : 'digital';
  const c = CONTEUDO[modo];

  // Linha de leitura a varrer o ícone + pulso à volta
  const varrimento = useSharedValue(0);
  const pulso = useSharedValue(0);
  useEffect(() => {
    varrimento.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }),
          withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.quad) })
        ),
        -1
      )
    );
    pulso.set(withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1));
  }, [varrimento, pulso]);

  const estiloLinha = useAnimatedStyle(() => ({ transform: [{ translateY: varrimento.value * 150 }] }));
  const estiloPulso = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - pulso.value),
    transform: [{ scale: 1 + pulso.value * 0.5 }],
  }));

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + spacing.xl }]}>
      <Stack.Screen options={comCabecalho(c.titulo)} />

      <View style={styles.centro}>
        <Etiqueta texto="Brevemente" cor={colors.purple} fundo={colors.purpleSoft} icone="rocket-launch-outline" />

        <View style={styles.leitor}>
          <Animated.View style={[styles.pulso, estiloPulso]} />
          <View style={styles.janela}>
            <MaterialCommunityIcons name={c.icone} size={110} color={colors.primary} />
            <Animated.View style={[styles.linha, estiloLinha]} />
          </View>
        </View>

        <Text style={styles.instrucao}>{c.instrucao}</Text>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.aviso}>
          <MaterialCommunityIcons name="information-outline" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.avisoTitulo}>Funcionalidade em desenvolvimento</Text>
            <Text style={styles.avisoTexto}>{c.texto}</Text>
          </View>
        </Animated.View>
      </View>

      <Button titulo="Usar o código do paciente" icone="keyboard-outline" variante="secundario" onPress={voltar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, padding: spacing.xl },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  leitor: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center', marginVertical: spacing.md },
  pulso: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: colors.primarySoft,
  },
  janela: {
    width: 170,
    height: 170,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.primarySoft,
    backgroundColor: colors.primaryFaint,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  linha: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
    opacity: 0.7,
  },
  instrucao: { fontFamily: fontFamily.semibold, fontSize: 16, color: colors.primaryDark, textAlign: 'center' },
  aviso: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.primaryFaint,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  avisoTitulo: { fontFamily: fontFamily.semibold, fontSize: 14, color: colors.primaryDark },
  avisoTexto: { fontFamily: fontFamily.regular, fontSize: 13, color: colors.text, lineHeight: 19, marginTop: 2 },
});
