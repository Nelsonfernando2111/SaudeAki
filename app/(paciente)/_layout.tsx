import { useCallback, useEffect, useRef } from 'react';
import { router, Stack } from 'expo-router';

import { useTopico } from '@/src/hooks/useTopico';
import { obterMeuPerfil } from '@/src/services/paciente.service';
import { listarPedidos } from '@/src/services/pedido.service';
import { topicos } from '@/src/services/realtime';
import { useSessaoStore } from '@/src/store/sessao.store';
import { estadoEfetivo } from '@/src/utils/pedidos';
import type { PedidoAcesso } from '@/src/types';
import { colors } from '@/src/theme';

const INTERVALO_POLLING_MS = 10000;

export default function PacienteLayout() {
  const paciente = useSessaoStore((s) => s.paciente);
  const definirPaciente = useSessaoStore((s) => s.definirPaciente);
  const vistos = useRef(new Set<number>());

  // Recarrega o perfil quando a app abre com sessão guardada
  useEffect(() => {
    if (!paciente) obterMeuPerfil().then(definirPaciente).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Abre o ecrã de aprovação para um pedido novo (só uma vez por pedido) */
  const abrirPedido = useCallback((p: PedidoAcesso) => {
    if (!p?.id || vistos.current.has(p.id) || estadoEfetivo(p) !== 'PENDENTE') return;
    vistos.current.add(p.id);
    router.push({
      pathname: '/(paciente)/pedido-acesso',
      params: {
        id: String(p.id),
        medicoNome: p.medicoNome,
        unidadeSanitariaNome: p.unidadeSanitariaNome ?? '',
        dataExpiracao: p.dataExpiracao,
      },
    } as any);
  }, []);

  // Tempo real: /topic/paciente/{codUnico}/pedidos
  useTopico<PedidoAcesso>(paciente ? topicos.pedidosDoPaciente(paciente.codUnico) : null, abrirPedido);

  // Fallback se o WebSocket falhar (e sem push FCM configurado)
  useEffect(() => {
    if (!paciente) return;
    const verificar = () =>
      listarPedidos({ estado: 'PENDENTE', size: 5 })
        .then((pagina) => pagina.content.forEach(abrirPedido))
        .catch(() => {});
    verificar();
    const t = setInterval(verificar, INTERVALO_POLLING_MS);
    return () => clearInterval(t);
  }, [paciente?.id, abrirPedido]);

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
        name="pedido-acesso"
        options={{ animation: 'slide_from_bottom', gestureEnabled: false }}
      />
    </Stack>
  );
}
