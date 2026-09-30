import { api } from './api';
import { criarPedidoMock, pedidosMock } from '@/src/mocks/pedidos.mock';
import type { EstadoPedido, Medico, Paciente, PedidoAcesso } from '@/src/types';
import { adicionarAcessoMock } from '@/src/mocks/acessos.mock';

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function obterPedido(id: string): Promise<PedidoAcesso | null> {
  try {
    const { data } = await api.get<PedidoAcesso>(`/pedidos/${id}`);
    return data;
  } catch {
    await esperar(200);
    return pedidosMock.find((p) => p.id === id) ?? null;
  }
}

export async function responderPedido(
  id: string,
  estado: Extract<EstadoPedido, 'aprovado' | 'negado'>
): Promise<void> {
  try {
    await api.patch(`/pedidos/${id}`, { estado });
    } catch {
    await esperar(500);
    const pedido = pedidosMock.find((p) => p.id === id);
    if (pedido) {
      pedido.estado = estado;
      if (estado === 'aprovado') {
        adicionarAcessoMock(pedido.paciente.id, pedido.medico, 'completo');
      }
    }
  }
}

/** Só para demonstração: simula o médico a pedir acesso */
export function criarPedidoDemo(paciente: Pick<Paciente, 'id' | 'codigo' | 'nome'>): string {
  return criarPedidoMock(paciente).id;
}
/** O médico solicita acesso completo ao histórico de um paciente */
/** O médico solicita acesso completo ao histórico de um paciente */
export async function solicitarAcesso(
  medico: Medico,
  paciente: Pick<Paciente, 'id' | 'codigo' | 'nome'>
): Promise<PedidoAcesso> {
  try {
    const { data } = await api.post<PedidoAcesso>('/pedidos', {
      medicoId: medico.id,
      pacienteId: paciente.id,
    });
    return data;
  } catch {
    await esperar(400);
    return criarPedidoMock(paciente, medico);
  }
}
/** O médico cancela um pedido que ainda está pendente */
/** O médico cancela um pedido que ainda está pendente */
export async function cancelarPedido(id: string): Promise<void> {
  try {
    await api.patch(`/pedidos/${id}`, { estado: 'cancelado' });
  } catch {
    await esperar(300);
    const pedido = pedidosMock.find((p) => p.id === id);
    if (pedido) pedido.estado = 'cancelado';
  }
}
/** Verifica se o médico tem um pedido aprovado para este paciente */
export async function temAcessoCompleto(
  medicoId: string | undefined,
  pacienteId: string
): Promise<boolean> {
  try {
    const { data } = await api.get<{ autorizado: boolean }>(
      `/pacientes/${pacienteId}/acesso`
    );
    return data.autorizado;
  } catch {
    await esperar(150);
    return pedidosMock.some(
      (p) =>
        p.paciente.id === pacienteId &&
        p.estado === 'aprovado' &&
        (!medicoId || p.medico.id === medicoId)
    );
  }
}

/** Lista os pedidos enviados por um médico (mais recentes primeiro) */
export async function listarPedidosMedico(medicoId: string): Promise<PedidoAcesso[]> {
  try {
    const { data } = await api.get<PedidoAcesso[]>(`/medicos/${medicoId}/pedidos`);
    return data;
  } catch {
    await esperar(250);
    return pedidosMock
      .filter((p) => p.medico.id === medicoId)
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  }
}