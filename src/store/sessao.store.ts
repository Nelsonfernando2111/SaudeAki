import { create } from 'zustand';
import type { Medico, Paciente } from '@/src/types';
import { terminarSessao } from '@/src/services/auth.service';
import { limparSessao } from '@/src/utils/sessao';

interface SessaoState {
  paciente: Paciente | null;
  medico: Medico | null;
  definirPaciente: (p: Paciente) => void;
  definirMedico: (m: Medico) => void;
  /** Logout no servidor + apaga a sessão local */
  sair: () => Promise<void>;
  /** Só limpa o estado local (ex.: sessão expirada) */
  limpar: () => Promise<void>;
}

export const useSessaoStore = create<SessaoState>((set) => ({
  paciente: null,
  medico: null,
  definirPaciente: (paciente) => set({ paciente }),
  definirMedico: (medico) => set({ medico }),
  sair: async () => {
    await terminarSessao();
    set({ paciente: null, medico: null });
  },
  limpar: async () => {
    await limparSessao();
    set({ paciente: null, medico: null });
  },
}));
