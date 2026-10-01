import { api } from './api';
import type { UnidadeSanitaria } from '@/src/types';

/* Secção 10 da API: unidades sanitárias (leitura para qualquer utilizador autenticado) */

export async function listarUnidades(): Promise<UnidadeSanitaria[]> {
  const { data } = await api.get<UnidadeSanitaria[]>('/unidades');
  return data;
}

export async function obterUnidade(id: number): Promise<UnidadeSanitaria> {
  const { data } = await api.get<UnidadeSanitaria>(`/unidades/${id}`);
  return data;
}
