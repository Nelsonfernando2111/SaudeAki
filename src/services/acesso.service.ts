import { api } from './api';
import type { Page, RegistoAcesso, SessaoAcesso } from '@/src/types';

/* Auditoria e sessões de acesso do paciente autenticado */

/** GET /pacientes/me/acessos — quem acedeu ao histórico, do mais recente */
export async function listarMeusAcessos(page = 0, size = 20): Promise<Page<RegistoAcesso>> {
  const { data } = await api.get<Page<RegistoAcesso>>('/pacientes/me/acessos', {
    params: { page, size },
  });
  return data;
}

/** GET /pacientes/me/sessoes — médicos com acesso completo neste momento */
export async function listarMinhasSessoes(): Promise<SessaoAcesso[]> {
  const { data } = await api.get<SessaoAcesso[]>('/pacientes/me/sessoes');
  return data;
}

/** PUT /sessoes/{id}/revogar — corta o acesso do médico de imediato */
export async function revogarSessao(id: number): Promise<SessaoAcesso> {
  const { data } = await api.put<SessaoAcesso>(`/sessoes/${id}/revogar`);
  return data;
}
