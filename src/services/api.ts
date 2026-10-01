import axios, { AxiosError, create, isAxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { CorpoErroApi, RespostaLogin } from '@/src/types';
import { atualizarTokens, limparSessao, obterSessao } from '@/src/utils/sessao';

/* =====================================================================
 * Cliente HTTP da API
 * - define a URL base
 * - junta "Authorization: Bearer <accessToken>" a todos os pedidos
 *   exceto às rotas públicas
 * - num 401, renova o token com o refreshToken (uma vez) e repete o pedido
 * - converte qualquer erro num ErroApi com a mensagem do backend
 * ===================================================================== */

/** Ex.: https://txunasaude.onrender.com/api (definir EXPO_PUBLIC_API_URL no .env) */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'https://txunasaude.onrender.com/api').replace(
  /\/+$/,
  ''
);

/** Origem do servidor, sem "/api" (para URLs como "/api/exames/fotos/1" e o WebSocket) */
export const SERVIDOR_URL = API_URL.replace(/\/api$/, '');

/** Rotas que não levam token */
const ROTAS_PUBLICAS = ['/auth/login', '/auth/registo', '/auth/refresh'];

const ePublica = (url?: string) => !!url && ROTAS_PUBLICAS.some((r) => url.startsWith(r));

export const api = create({
  baseURL: API_URL,
  // O Render pode demorar a "acordar" o servidor
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

/* ---------- Erros ---------- */

export class ErroApi extends Error {
  status?: number;
  detalhes: string[];

  constructor(mensagem: string, status?: number, detalhes: string[] = []) {
    super(mensagem);
    this.name = 'ErroApi';
    this.status = status;
    this.detalhes = detalhes;
  }
}

const MENSAGENS_POR_STATUS: Record<number, string> = {
  400: 'Dados inválidos. Verifique os campos.',
  401: 'Sessão inválida ou credenciais incorretas.',
  403: 'Não tem permissão para esta ação.',
  404: 'Não encontrado.',
  409: 'Este registo já existe ou já foi respondido.',
  410: 'O pedido expirou.',
  413: 'O ficheiro é maior que 5 MB.',
  415: 'Tipo de ficheiro não suportado.',
  500: 'Erro no servidor. Tente novamente mais tarde.',
};

export function paraErroApi(erro: unknown): ErroApi {
  if (erro instanceof ErroApi) return erro;
  if (isAxiosError(erro)) {
    if (erro.response) {
      const { status, data } = erro.response as { status: number; data?: CorpoErroApi };
      const mensagem =
        data?.mensagem || MENSAGENS_POR_STATUS[status] || data?.erro || 'Ocorreu um erro.';
      return new ErroApi(mensagem, status, data?.detalhes ?? []);
    }
    if (erro.code === 'ECONNABORTED') {
      return new ErroApi('O servidor demorou demasiado a responder. Tente de novo.');
    }
    return new ErroApi('Sem ligação ao servidor. Verifique a sua internet.');
  }
  return new ErroApi(erro instanceof Error ? erro.message : 'Ocorreu um erro inesperado.');
}

/* ---------- Sessão expirada ---------- */

let aoExpirarSessao: (() => void) | null = null;

/** O layout raiz regista aqui o que fazer quando o refresh falha (ir para o login) */
export function definirAoExpirarSessao(callback: (() => void) | null) {
  aoExpirarSessao = callback;
}

/* ---------- Pedido: junta o token ---------- */

api.interceptors.request.use(async (config) => {
  if (ePublica(config.url)) {
    config.headers.delete('Authorization');
    return config;
  }
  const sessao = await obterSessao();
  if (sessao?.accessToken) {
    config.headers.set('Authorization', `Bearer ${sessao.accessToken}`);
  }
  // FormData: deixa o RN definir o boundary do multipart
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    config.headers.delete('Content-Type');
  }
  return config;
});

/* ---------- Resposta: renova o token num 401 ---------- */

let renovacaoEmCurso: Promise<string | null> | null = null;

async function renovarToken(): Promise<string | null> {
  const sessao = await obterSessao();
  if (!sessao?.refreshToken) return null;
  try {
    // axios "puro" para não passar pelos interceptores
    const { data } = await axios.post<RespostaLogin>(
      `${API_URL}/auth/refresh`,
      { refreshToken: sessao.refreshToken },
      { timeout: 30000 }
    );
    await atualizarTokens(data.accessToken, data.refreshToken ?? sessao.refreshToken);
    return data.accessToken;
  } catch {
    return null;
  }
}

type ConfigComRepeticao = InternalAxiosRequestConfig & { _repetido?: boolean };

api.interceptors.response.use(
  (resposta) => resposta,
  async (erro: AxiosError) => {
    const original = erro.config as ConfigComRepeticao | undefined;

    if (erro.response?.status === 401 && original && !original._repetido && !ePublica(original.url)) {
      original._repetido = true;

      // Vários pedidos a falhar ao mesmo tempo partilham a mesma renovação
      renovacaoEmCurso ??= renovarToken().finally(() => {
        renovacaoEmCurso = null;
      });
      const novoToken = await renovacaoEmCurso;

      if (novoToken) {
        original.headers.set('Authorization', `Bearer ${novoToken}`);
        return api(original);
      }

      await limparSessao();
      aoExpirarSessao?.();
      return Promise.reject(new ErroApi('A sua sessão expirou. Entre novamente.', 401));
    }

    return Promise.reject(paraErroApi(erro));
  }
);

/** Cabeçalho de autorização para usar fora do axios (ex.: <Image source={{ headers }} />) */
export async function cabecalhoAutorizacao(): Promise<Record<string, string>> {
  const sessao = await obterSessao();
  return sessao?.accessToken ? { Authorization: `Bearer ${sessao.accessToken}` } : {};
}
