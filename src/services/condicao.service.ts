import { api } from './api';
import type { CondicaoMedica, DadosCondicao } from '@/src/types';

/* Secção 6 da API: escritas só para médico com sessão ativa */

export async function registarCondicao(
  pacienteId: string,
  dados: DadosCondicao
): Promise<CondicaoMedica> {
  const { data } = await api.post<CondicaoMedica>(
    `/pacientes/${encodeURIComponent(pacienteId)}/condicoes`,
    dados
  );
  return data;
}

/** Substitui os três campos */
export async function atualizarCondicao(id: number, dados: DadosCondicao): Promise<CondicaoMedica> {
  const { data } = await api.put<CondicaoMedica>(`/condicoes/${id}`, dados);
  return data;
}

export async function removerCondicao(id: number): Promise<void> {
  await api.delete(`/condicoes/${id}`);
}
