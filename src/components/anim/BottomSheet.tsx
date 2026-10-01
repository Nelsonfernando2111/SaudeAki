import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, fontFamily, radius, spacing } from '@/src/theme';

interface BottomSheetProps {
  visivel: boolean;
  aoFechar: () => void;
  titulo: string;
  children: React.ReactNode;
}

/** Menu inferior que se arrasta para baixo para fechar (Bottom Sheet Drag) */
export function BottomSheet({ visivel, aoFechar, titulo, children }: BottomSheetProps) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [montado, setMontado] = useState(visivel);
  const [visivelAnterior, setVisivelAnterior] = useState(visivel);
  const y = useSharedValue(height);

  // Monta logo que fica visível; só desmonta no fim da animação de saída
  if (visivel !== visivelAnterior) {
    setVisivelAnterior(visivel);
    if (visivel) setMontado(true);
  }

  useEffect(() => {
    if (visivel) {
      y.set(height);
      y.set(withSpring(0, { damping: 22, stiffness: 220, mass: 0.9 }));
    } else {
      y.set(
        withTiming(height, { duration: 220, easing: Easing.in(Easing.quad) }, (fim) => {
          if (fim) scheduleOnRN(setMontado, false);
        })
      );
    }
  }, [visivel, height, y]);

  const arrastar = Gesture.Pan()
    .onUpdate((e) => {
      y.set(Math.max(0, e.translationY));
    })
    .onEnd((e) => {
      if (e.translationY > 120 || e.velocityY > 900) {
        scheduleOnRN(aoFechar);
      } else {
        y.set(withSpring(0, { damping: 20, stiffness: 240 }));
      }
    });

  const estiloFolha = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  const estiloFundo = useAnimatedStyle(() => ({
    opacity: interpolate(y.value, [0, height * 0.6], [1, 0], 'clamp'),
  }));

  if (!montado) return null;

  return (
    <Modal transparent visible statusBarTranslucent animationType="none" onRequestClose={aoFechar}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.fundo, estiloFundo]}>
          <Pressable style={{ flex: 1 }} onPress={aoFechar} accessibilityLabel="Fechar" />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.posicao}
          pointerEvents="box-none"
        >
          <Animated.View
            style={[styles.folha, { maxHeight: height * 0.9, paddingBottom: insets.bottom + spacing.lg }, estiloFolha]}
          >
            <GestureDetector gesture={arrastar}>
              <View style={styles.topo}>
                <View style={styles.pega} />
                <View style={styles.tituloLinha}>
                  <Text style={styles.titulo}>{titulo}</Text>
                  <Pressable onPress={aoFechar} hitSlop={12} accessibilityLabel="Fechar">
                    <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
                  </Pressable>
                </View>
              </View>
            </GestureDetector>

            {/* flexShrink: sem isto o ScrollView cresce além da folha e o botão final fica inacessível */}
            <ScrollView
              style={styles.rolagem}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.conteudo}
            >
              {children}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: { backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  posicao: { flex: 1, justifyContent: 'flex-end' },
  folha: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  topo: { paddingTop: spacing.sm, paddingHorizontal: spacing.xl },
  pega: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  tituloLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
  },
  titulo: { fontFamily: fontFamily.semibold, fontSize: 18, color: colors.primaryDark },
  rolagem: { flexShrink: 1 },
  conteudo: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.lg },
});
