import { useEffect } from 'react';
import { Stack } from 'expo-router';

import { obterMeuPerfilMedico } from '@/src/services/medico.service';
import { useSessaoStore } from '@/src/store/sessao.store';
import { colors } from '@/src/theme';

export default function MedicoLayout() {
  const medico = useSessaoStore((s) => s.medico);
  const definirMedico = useSessaoStore((s) => s.definirMedico);

  // Recarrega o perfil quando a app abre com sessão guardada
  useEffect(() => {
    if (!medico) obterMeuPerfilMedico().then(definirMedico).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen
        name="aguardando-aprovacao"
        options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
      />
    </Stack>
  );
}
