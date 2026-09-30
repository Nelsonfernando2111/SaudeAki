import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Perfil } from '@/src/types';

const CHAVE_SESSAO = '@idclin:sessao';

export interface Sessao {
  perfil: Perfil;
  token?: string;
  id?: string;
}

export async function obterSessao(): Promise<Sessao | null> {
  try {
    const valor = await AsyncStorage.getItem(CHAVE_SESSAO);
    return valor ? (JSON.parse(valor) as Sessao) : null;
  } catch {
    return null;
  }
}

export async function guardarSessao(sessao: Sessao): Promise<void> {
  await AsyncStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
}

export async function limparSessao(): Promise<void> {
  await AsyncStorage.removeItem(CHAVE_SESSAO);
}