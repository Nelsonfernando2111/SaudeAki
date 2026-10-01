import { api } from './api';
import type { AlertaAlergia, DadosPrescricao, Prescricao } from '@/src/types';

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

/**
 * GET /pacientes/{id}/alergias/verificar — cruza o medicamento (e a classe) com as
 * alergias não resolvidas do paciente. Lista vazia = sem conflito.
 */
export async function verificarAlergias(
  pacienteId: string,
  medicamento: string,
  classe?: string
): Promise<AlertaAlergia[]> {
  const { data } = await api.get<AlertaAlergia[]>(
    `/pacientes/${encodeURIComponent(pacienteId)}/alergias/verificar`,
    { params: { medicamento, ...(classe ? { classe } : {}) } }
  );
  return data;
}

/** 409 devolvido quando a prescrição colide com uma alergia */
export function eAlertaAlergia(e: { status?: number; erro?: string }) {
  return e.status === 409 && /alergia/i.test(e.erro ?? '');
}
