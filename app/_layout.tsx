import { useEffect } from 'react';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

// Define a tarefa de fundo do push FCM (tem de ser carregado cedo)
import '@/src/services/notificacoes';
import { ToastHost } from '@/src/components/anim/ToastHost';
import { definirAoExpirarSessao } from '@/src/services/api';
import { useSessaoStore } from '@/src/store/sessao.store';
import { toast } from '@/src/store/toast.store';
import { colors } from '@/src/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontesCarregadas, erroFontes] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontesCarregadas || erroFontes) {
      SplashScreen.hideAsync();
    }
  }, [fontesCarregadas, erroFontes]);

  // Quando o refresh token também falha, volta ao início
  useEffect(() => {
    definirAoExpirarSessao(() => {
      useSessaoStore.getState().limpar();
      toast.info('A sua sessão expirou. Entre novamente.');
      router.replace('/(auth)/escolher-perfil' as any);
    });
    return () => definirAoExpirarSessao(null);
  }, []);

  if (!fontesCarregadas && !erroFontes) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="alterar-senha" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="exame/[id]" options={{ animation: 'slide_from_right' }} />
        </Stack>
        <ToastHost />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
