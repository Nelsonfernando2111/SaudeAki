import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useSessaoStore } from '@/src/store/sessao.store';

/**
 * Volta ao ecrã anterior. Se não houver histórico (ecrã aberto com `replace`,
 * por notificação ou link), vai para `destino` ou para o início do perfil atual.
 */
export function useVoltar(destino?: string) {
  const router = useRouter();

  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    const { medico, paciente } = useSessaoStore.getState();
    const inicio =
      destino ??
      (medico ? '/(medico)/(tabs)' : paciente ? '/(paciente)/(tabs)' : '/(auth)/escolher-perfil');
    router.replace(inicio as any);
  }, [router, destino]);
}
