import { api, SERVIDOR_URL } from './api';
import type { AnexoExame, DadosExame, Exame } from '@/src/types';

/* Secção 7 da API: exames e anexos */

export const TAMANHO_MAXIMO_ANEXO = 5 * 1024 * 1024;
export const TIPOS_ANEXO = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export async function registarExame(pacienteId: string, dados: DadosExame): Promise<Exame> {
  const { data } = await api.post<Exame>(
    `/pacientes/${encodeURIComponent(pacienteId)}/exames`,
    dados
  );
  return data;
}

/** O próprio paciente, ou médico com sessão ativa */
export async function obterExame(id: number | string): Promise<Exame> {
  const { data } = await api.get<Exame>(`/exames/${id}`);
  return data;
}

/** Atualização parcial. `resultados`, se vier, substitui todos os resultados */
export async function atualizarExame(id: number, dados: DadosExame): Promise<Exame> {
  const { data } = await api.put<Exame>(`/exames/${id}`, dados);
  return data;
}

/** O exame fica CANCELADO (não é apagado) */
export async function cancelarExame(id: number): Promise<Exame> {
  const { data } = await api.put<Exame>(`/exames/${id}/cancelar`);
  return data;
}

export async function listarAnexos(exameId: number | string): Promise<AnexoExame[]> {
  const { data } = await api.get<AnexoExame[]>(`/exames/${exameId}/fotos`);
  return data;
}

/** Anexa JPEG, PNG, WebP ou PDF (máx. 5 MB) — `uri` vem do seletor de ficheiros */
export async function anexarArquivo(
  exameId: number,
  arquivo: { uri: string; nome: string; tipo: string },
  descricao?: string,
  aoProgresso?: (fracao: number) => void
): Promise<AnexoExame> {
  const corpo = new FormData();
  // No React Native, um ficheiro em FormData é { uri, name, type }
  corpo.append('arquivo', { uri: arquivo.uri, name: arquivo.nome, type: arquivo.tipo } as any);
  if (descricao) corpo.append('descricao', descricao);
  const { data } = await api.post<AnexoExame>(`/exames/${exameId}/fotos`, corpo, {
    timeout: 120000,
    onUploadProgress: (e) => {
      if (e.total) aoProgresso?.(e.loaded / e.total);
    },
  });
  return data;
}

export async function removerAnexo(fotoId: number): Promise<void> {
  await api.delete(`/exames/fotos/${fotoId}`);
}

/** URL absoluta do ficheiro (pedir com o cabeçalho Authorization) */
export function urlAnexo(anexo: AnexoExame): string {
  return `${SERVIDOR_URL}${anexo.url}`;
}
