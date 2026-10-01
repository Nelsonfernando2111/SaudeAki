import { api } from './api';
import type { AtualizacaoMedico, Medico } from '@/src/types';

/* Secção 9 da API: médicos */

export async function obterMeuPerfilMedico(): Promise<Medico> {
  const { data } = await api.get<Medico>('/medicos/me');
  return data;
}

/** Atualização parcial */
export async function atualizarMeuPerfilMedico(dados: AtualizacaoMedico): Promise<Medico> {
  const { data } = await api.put<Medico>('/medicos/me', dados);
  return data;
}

export async function obterMedico(id: string): Promise<Medico> {
  const { data } = await api.get<Medico>(`/medicos/${id}`);
  return data;
}

export async function listarMedicos(): Promise<Medico[]> {
  const { data } = await api.get<Medico[]>('/medicos');
  return data;
}
