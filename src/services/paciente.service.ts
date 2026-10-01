import { api } from './api';
import type {
  AtualizacaoPaciente,
  CondicaoMedica,
  Exame,
  FichaEmergencia,
  HistoricoClinico,
  Paciente,
  Page,
  Prescricao,
} from '@/src/types';

/* Secções 3 e 4 da API: paciente autenticado e histórico clínico.
 * Onde aparece `id`, pode usar-se o UUID ou o código único (PAC-XXXX). */

/* ---------- Paciente autenticado (/me) ---------- */

export async function obterMeuPerfil(): Promise<Paciente> {
  const { data } = await api.get<Paciente>('/pacientes/me');
  return data;
}

/** Atualização parcial: só mudam os campos enviados */
export async function atualizarMeuPerfil(dados: AtualizacaoPaciente): Promise<Paciente> {
  const { data } = await api.put<Paciente>('/pacientes/me', dados);
  return data;
}

/** Regista o token FCM do telemóvel para receber pedidos de acesso por push */
export async function registarTokenFcm(token: string): Promise<void> {
  await api.put('/pacientes/me/fcm-token', { token });
}

export async function obterMeuHistorico(): Promise<HistoricoClinico> {
  const { data } = await api.get<HistoricoClinico>('/pacientes/me/historico');
  return data;
}

/* ---------- Histórico de um paciente (médico) ---------- */

/** Ficha de emergência: o médico não precisa de aprovação (fica registado) */
export async function obterFichaEmergencia(id: string): Promise<FichaEmergencia> {
  const { data } = await api.get<FichaEmergencia>(
    `/pacientes/${encodeURIComponent(id)}/emergencia`
  );
  return data;
}

/** Histórico completo: médico precisa de sessão ativa (senão 403) */
export async function obterHistoricoCompleto(id: string): Promise<HistoricoClinico> {
  const { data } = await api.get<HistoricoClinico>(`/pacientes/${encodeURIComponent(id)}`);
  return data;
}

export async function listarCondicoes(id: string): Promise<CondicaoMedica[]> {
  const { data } = await api.get<CondicaoMedica[]>(`/pacientes/${encodeURIComponent(id)}/condicoes`);
  return data;
}

export async function listarExames(id: string, page = 0, size = 10): Promise<Page<Exame>> {
  const { data } = await api.get<Page<Exame>>(`/pacientes/${encodeURIComponent(id)}/exames`, {
    params: { page, size },
  });
  return data;
}

export async function listarPrescricoes(id: string): Promise<Prescricao[]> {
  const { data } = await api.get<Prescricao[]>(
    `/pacientes/${encodeURIComponent(id)}/prescricoes`
  );
  return data;
}

/** Medicação atual: também acessível em emergência */
export async function listarPrescricoesAtivas(id: string): Promise<Prescricao[]> {
  const { data } = await api.get<Prescricao[]>(
    `/pacientes/${encodeURIComponent(id)}/prescricoes/ativas`
  );
  return data;
}
