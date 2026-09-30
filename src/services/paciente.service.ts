import axios from 'axios';
import { api } from './api';
import { pacientesMock, type PacienteMock } from '@/src/mocks/pacientes.mock';
import type { Paciente } from '@/src/types';

export interface SessaoPaciente {
  token: string;
  paciente: Paciente;
}

export interface DadosRegisto {
  nome: string;
  contacto: string; // email ou telefone
  senha: string;
}

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

function semSenha(p: PacienteMock): Paciente {
  const { senha: _senha, ...resto } = p;
  return resto;
}

/** Erros que vêm do backend e devem ser mostrados (não usam fallback) */
function erroDeNegocio(erro: unknown): string | null {
  if (axios.isAxiosError(erro) && erro.response) {
    const status = erro.response.status;
    if ([400, 401, 409].includes(status)) {
      return erro.response.data?.message ?? 'Dados inválidos.';
    }
  }
  return null;
}

/* ---------- LOGIN ---------- */

export async function loginPaciente(
  identificador: string,
  senha: string
): Promise<SessaoPaciente> {
  try {
    const { data } = await api.post<SessaoPaciente>('/auth/paciente/login', {
      identificador,
      senha,
    });
    return data;
  } catch (erro) {
    const msg = erroDeNegocio(erro);
    if (msg) throw new Error(msg);
    return loginMock(identificador, senha);
  }
}

async function loginMock(identificador: string, senha: string): Promise<SessaoPaciente> {
  await esperar(700);
  const id = identificador.trim().toLowerCase();
  const encontrado = pacientesMock.find(
    (p) =>
      p.codigo.toLowerCase() === id ||
      p.email?.toLowerCase() === id ||
      p.telefone === id
  );
  if (!encontrado || encontrado.senha !== senha) {
    throw new Error('Código, email/telefone ou senha incorretos.');
  }
  return { token: 'mock-token-paciente', paciente: semSenha(encontrado) };
}

/* ---------- REGISTO ---------- */

export async function registarPaciente(dados: DadosRegisto): Promise<SessaoPaciente> {
  try {
    const { data } = await api.post<SessaoPaciente>('/auth/paciente/registo', dados);
    return data;
  } catch (erro) {
    const msg = erroDeNegocio(erro);
    if (msg) throw new Error(msg);
    return registarMock(dados);
  }
}

async function registarMock(dados: DadosRegisto): Promise<SessaoPaciente> {
  await esperar(900);
  const contacto = dados.contacto.trim().toLowerCase();
  const existe = pacientesMock.some(
    (p) => p.email?.toLowerCase() === contacto || p.telefone === contacto
  );
  if (existe) throw new Error('Já existe uma conta com este contacto.');

  const eEmail = contacto.includes('@');
  const novo: PacienteMock = {
    id: `p${Date.now()}`,
    codigo: `IDCLIN-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    nome: dados.nome.trim(),
    email: eEmail ? contacto : undefined,
    telefone: eEmail ? undefined : contacto,
    senha: dados.senha,
    ativo: true,
    tipoSanguineo: '—',
    alergias: [],
    condicoesCronicas: [],
    medicacaoAtiva: [],
    exames: [],
  };
  pacientesMock.push(novo);
  return { token: 'mock-token-paciente', paciente: semSenha(novo) };
}
/* ---------- OBTER PACIENTE ---------- */

export async function obterPaciente(id: string): Promise<Paciente | null> {
  try {
    const { data } = await api.get<Paciente>(`/pacientes/${id}`);
    return data;
  } catch {
    await esperar(300);
    const encontrado = pacientesMock.find((p) => p.id === id);
    return encontrado ? semSenha(encontrado) : null;
  }
}
/* ---------- PESQUISA (médico) ---------- */

export async function pesquisarPacientes(termo: string): Promise<Paciente[]> {
  try {
    const { data } = await api.get<Paciente[]>('/pacientes', { params: { q: termo } });
    return data;
  } catch {
    await esperar(300);
    const t = termo.trim().toLowerCase();
    const lista = t
      ? pacientesMock.filter(
          (p) => p.codigo.toLowerCase().includes(t) || p.nome.toLowerCase().includes(t)
        )
      : pacientesMock.slice(0, 3); // sem termo: "resultados recentes"
    return lista.map(semSenha);
  }
}