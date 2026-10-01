import { api, ErroApi } from './api';
import type { DadosRegisto, Paciente, Perfil, RespostaLogin, Role } from '@/src/types';
import { guardarSessao, limparSessao } from '@/src/utils/sessao';

/* Secção 2 da API: autenticação */

const PERFIL_POR_ROLE: Partial<Record<Role, Perfil>> = {
  PACIENTE: 'paciente',
  MEDICO: 'medico',
};

/** POST /auth/login — paciente usa o código único (PAC-XXXX); médico usa o email */
export async function entrar(
  identificador: string,
  senha: string,
  perfilEsperado: Perfil
): Promise<RespostaLogin> {
  const { data } = await api.post<RespostaLogin>('/auth/login', {
    identificador: identificador.trim(),
    senha,
  });

  const perfil = PERFIL_POR_ROLE[data.role];
  if (!perfil) {
    throw new ErroApi('Esta aplicação é apenas para pacientes e médicos.');
  }
  if (perfil !== perfilEsperado) {
    throw new ErroApi(
      perfil === 'medico'
        ? 'Esta conta é de médico. Use o acesso de médico.'
        : 'Esta conta é de paciente. Use o acesso de paciente.'
    );
  }

  await guardarSessao({
    perfil,
    role: data.role,
    id: data.id,
    nome: data.nomeCompleto,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });
  return data;
}

/** POST /auth/registo — devolve o paciente com o código único gerado */
export async function registarPaciente(dados: DadosRegisto): Promise<Paciente> {
  const { data } = await api.post<Paciente>('/auth/registo', dados);
  return data;
}

/** PUT /auth/senha — termina as sessões de refresh dos outros dispositivos */
export async function alterarSenha(senhaAtual: string, novaSenha: string): Promise<void> {
  await api.put('/auth/senha', { senhaAtual, novaSenha });
}

/** POST /auth/logout — invalida o refresh token e apaga a sessão local */
export async function terminarSessao(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    // Mesmo sem rede, a sessão local tem de ser apagada
  } finally {
    await limparSessao();
  }
}
