import { useEffect } from 'react';
import { Stack } from 'expo-router';

import { obterMeuPerfilMedico } from '@/src/services/medico.service';
import { useSessaoStore } from '@/src/store/sessao.store';
import { comCabecalho, opcoesStack } from '@/src/utils/navegacao';

export default function MedicoLayout() {
  const medico = useSessaoStore((s) => s.medico);
  const definirMedico = useSessaoStore((s) => s.definirMedico);

  // Recarrega o perfil quando a app abre com sessão guardada
  useEffect(() => {
    if (!medico) obterMeuPerfilMedico().then(definirMedico).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Stack screenOptions={opcoesStack}>
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="paciente/[id]" options={comCabecalho('Ficha de Emergência')} />
      <Stack.Screen name="historico/[id]" options={comCabecalho('Histórico Clínico')} />
    </Stack>
  );
}
