import { api } from './api';
import type { DadosPrescricao, Prescricao } from '@/src/types';

/* Secção 8 da API: prescrições (médico com sessão ativa) */

export async function registarPrescricao(
  pacienteId: string,
  dados: Required<Pick<DadosPrescricao, 'nomeMedicamento'>> & DadosPrescricao
): Promise<Prescricao> {
  const { data } = await api.post<Prescricao>(
    `/pacientes/${encodeURIComponent(pacienteId)}/prescricoes`,
    dados
  );
  return data;
}

/** Atualização parcial. `{ ativa: false }` encerra a prescrição */
export async function atualizarPrescricao(id: number, dados: DadosPrescricao): Promise<Prescricao> {
  const { data } = await api.put<Prescricao>(`/prescricoes/${id}`, dados);
  return data;
}

export const encerrarPrescricao = (id: number) => atualizarPrescricao(id, { ativa: false });
