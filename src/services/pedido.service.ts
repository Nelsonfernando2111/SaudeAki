import { api } from './api';
import type { EstadoPedido, Page, PedidoAcesso, PedidoAcessoResumo } from '@/src/types';

/* Secção 5 da API: pedido de acesso completo (prazo de 60 s, sessão de 30 min) */

/** Médico pede acesso completo ao paciente com este código único */
export async function solicitarAcesso(codUnicoPaciente: string): Promise<PedidoAcesso> {
  const { data } = await api.post<PedidoAcesso>('/pedidos-acesso', {
    codUnicoPaciente: codUnicoPaciente.trim().toUpperCase(),
  });
  return data;
}

/** Fallback do WebSocket. Passados os 60 s sem resposta, devolve EXPIRADO */
export async function obterEstadoPedido(id: number | string): Promise<EstadoPedido> {
  const { data } = await api.get<EstadoPedido>(`/pedidos-acesso/${id}/estado`);
  return data;
}

export async function aprovarPedido(id: number | string): Promise<PedidoAcessoResumo> {
  const { data } = await api.put<PedidoAcessoResumo>(`/pedidos-acesso/${id}/aprovar`);
  return data;
}

export async function negarPedido(id: number | string): Promise<PedidoAcessoResumo> {
  const { data } = await api.put<PedidoAcessoResumo>(`/pedidos-acesso/${id}/negar`);
  return data;
}

/** Paciente: pedidos recebidos. Médico: pedidos feitos. `estado` só filtra para paciente */
export async function listarPedidos(
  opcoes: { estado?: EstadoPedido; page?: number; size?: number } = {}
): Promise<Page<PedidoAcesso>> {
  const { estado, page = 0, size = 10 } = opcoes;
  const { data } = await api.get<Page<PedidoAcesso>>('/pedidos-acesso/lista', {
    params: { estado, page, size },
  });
  return data;
}
