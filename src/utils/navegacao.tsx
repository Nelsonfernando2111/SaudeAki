import { Platform } from 'react-native';
import type { NativeStackNavigationOptions } from 'expo-router';
import { CabecalhoApp } from '@/src/components/ui/CabecalhoApp';
import { colors } from '@/src/theme';

/**
 * Opções comuns a todos os Stacks. No Android, o react-native-screens aplica por
 * omissão `statusBarStyle: 'light'` (ícones brancos) em cada ecrã, o que escondia
 * a hora sobre o fundo branco: forçamos ícones escuros.
 */
export const opcoesStack: NativeStackNavigationOptions = {
  headerShown: false,
  animation: 'slide_from_right',
  contentStyle: { backgroundColor: colors.background },
  ...(Platform.OS === 'android' ? { statusBarStyle: 'dark', statusBarHidden: false } : {}),
};

/** Ecrã empilhado com o cabeçalho genérico (seta de voltar + título) */
export function comCabecalho(titulo: string): NativeStackNavigationOptions {
  return {
    headerShown: true,
    title: titulo,
    header: () => <CabecalhoApp titulo={titulo} voltar />,
  };
}
