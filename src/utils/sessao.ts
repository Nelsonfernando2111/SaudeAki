import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Perfil, Role } from '@/src/types';

const CHAVE_SESSAO = '@idclin:sessao';

export interface Sessao {
  perfil: Perfil;
  role: Role;
  id: string;
  nome: string;
  accessToken: string;
  refreshToken: string;
}

/** Cópia em memória, para o interceptor não ler o AsyncStorage em cada pedido */
let emMemoria: Sessao | null | undefined;

function valida(valor: unknown): valor is Sessao {
  const s = valor as Sessao | null;
  return !!s && typeof s.accessToken === 'string' && typeof s.refreshToken === 'string';
}

export async function obterSessao(): Promise<Sessao | null> {
  if (emMemoria !== undefined) return emMemoria;
  try {
    const valor = await AsyncStorage.getItem(CHAVE_SESSAO);
    const lida = valor ? JSON.parse(valor) : null;
    // Sessões antigas (antes da API real) não têm tokens: descarta-as
    emMemoria = valida(lida) ? lida : null;
  } catch {
    emMemoria = null;
  }
  return emMemoria;
}

export async function guardarSessao(sessao: Sessao): Promise<void> {
  emMemoria = sessao;
  await AsyncStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
}

/** Atualiza só os tokens (depois de um refresh) */
export async function atualizarTokens(accessToken: string, refreshToken: string): Promise<void> {
  const atual = await obterSessao();
  if (!atual) return;
  await guardarSessao({ ...atual, accessToken, refreshToken });
}

export async function limparSessao(): Promise<void> {
  emMemoria = null;
  await AsyncStorage.removeItem(CHAVE_SESSAO);
}
