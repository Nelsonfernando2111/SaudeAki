import axios from 'axios';
import { api } from './api';
import { medicosMock, type MedicoMock } from '@/src/mocks/medicos.mock';
import type { Medico } from '@/src/types';

export interface SessaoMedico {
  token: string;
  medico: Medico;
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

function semSenha(m: MedicoMock): Medico {
  const { senha: _senha, ...resto } = m;
  return resto;
}

function erroDeNegocio(erro: unknown): string | null {
  if (axios.isAxiosError(erro) && erro.response) {
    if ([400, 401].includes(erro.response.status)) {
      return erro.response.data?.message ?? 'Dados inválidos.';
    }
  }
  return null;
}

export async function loginMedico(email: string, senha: string): Promise<SessaoMedico> {
  try {
    const { data } = await api.post<SessaoMedico>('/auth/medico/login', { email, senha });
    return data;
  } catch (erro) {
    const msg = erroDeNegocio(erro);
    if (msg) throw new Error(msg);

    await esperar(700);
    const encontrado = medicosMock.find(
      (m) => m.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (!encontrado || encontrado.senha !== senha) {
      throw new Error('Email ou senha incorretos.');
    }
    return { token: 'mock-token-medico', medico: semSenha(encontrado) };
  }
}

export async function obterMedico(id: string): Promise<Medico | null> {
  try {
    const { data } = await api.get<Medico>(`/medicos/${id}`);
    return data;
  } catch {
    await esperar(300);
    const encontrado = medicosMock.find((m) => m.id === id);
    return encontrado ? semSenha(encontrado) : null;
  }
}