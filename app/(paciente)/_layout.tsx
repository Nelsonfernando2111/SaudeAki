import { useCallback, useEffect, useRef } from 'react';
import { router, Stack } from 'expo-router';

import { useTopico } from '@/src/hooks/useTopico';
import { ativarPushPaciente, ouvirPedidosPush, type DadosPushPedido } from '@/src/services/notificacoes';
import { obterMeuPerfil } from '@/src/services/paciente.service';
import { listarPedidos } from '@/src/services/pedido.service';
import { topicos } from '@/src/services/realtime';
import { useSessaoStore } from '@/src/store/sessao.store';
import { estadoEfetivo } from '@/src/utils/pedidos';
import type { PedidoAcesso } from '@/src/types';
import { useAvisosStore } from '@/src/store/avisos.store';
import { comCabecalho, opcoesStack } from '@/src/utils/navegacao';

const INTERVALO_POLLING_MS = 10000;

export default function PacienteLayout() {
  const paciente = useSessaoStore((s) => s.paciente);
  const definirPaciente = useSessaoStore((s) => s.definirPaciente);
  const vistos = useRef(new Set<number>());
  const definirPendentes = useAvisosStore((s) => s.definirPedidosPendentes);

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

  /** Abre o ecrã a partir de um push (sem dataExpiracao: o ecrã procura-a) */
  const abrirPorPush = useCallback((p: DadosPushPedido) => {
    const id = Number(p.pedidoId);
    if (vistos.current.has(id)) return;
    vistos.current.add(id);
    router.push({
      pathname: '/(paciente)/pedido-acesso',
      params: { id: p.pedidoId, medicoNome: p.medicoNome, unidadeSanitariaNome: p.unidadeSanitariaNome },
    } as any);
  }, []);

  const pacienteId = paciente?.id;

  // Push FCM: regista o token do telemóvel depois do login
  useEffect(() => {
    if (!pacienteId) return;
    let parar: (() => void) | undefined;
    ativarPushPaciente()
      .then((f) => {
        parar = f;
      })
      .catch(() => {});
    return () => parar?.();
  }, [pacienteId]);

  // Push recebido com a app aberta, ou toque na notificação (também com a app fechada)
  useEffect(() => {
    if (!pacienteId) return;
    return ouvirPedidosPush(abrirPorPush);
  }, [pacienteId, abrirPorPush]);

  // Tempo real: /topic/paciente/{codUnico}/pedidos
  useTopico<PedidoAcesso>(paciente ? topicos.pedidosDoPaciente(paciente.codUnico) : null, abrirPedido);

  // Fallback se o WebSocket falhar (e sem push FCM configurado)
  useEffect(() => {
    if (!pacienteId) return;
    const verificar = () =>
      listarPedidos({ estado: 'PENDENTE', size: 5 })
        .then((pagina) => {
          definirPendentes(pagina.content.filter((p) => estadoEfetivo(p) === 'PENDENTE'));
          pagina.content.forEach(abrirPedido);
        })
        .catch(() => {});
    verificar();
    const t = setInterval(verificar, INTERVALO_POLLING_MS);
    return () => clearInterval(t);
  }, [pacienteId, abrirPedido, definirPendentes]);

  return (
    <Stack screenOptions={opcoesStack}>
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="dados-pessoais" options={comCabecalho('Dados pessoais')} />
      <Stack.Screen
        name="pedido-acesso"
        options={{ ...comCabecalho('Pedido de Acesso'), animation: 'slide_from_bottom', gestureEnabled: false }}
      />
    </Stack>
  );
}
