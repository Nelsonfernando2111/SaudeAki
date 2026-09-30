import { create } from 'zustand';
import type { Medico, Paciente } from '@/src/types';
import { limparSessao } from '@/src/utils/sessao';

interface SessaoState {
  paciente: Paciente | null;
  medico: Medico | null;
  definirPaciente: (p: Paciente) => void;
  definirMedico: (m: Medico) => void;
  sair: () => Promise<void>;
}

export const useSessaoStore = create<SessaoState>((set) => ({
  paciente: null,
  medico: null,
  definirPaciente: (paciente) => set({ paciente }),
  definirMedico: (medico) => set({ medico }),
  sair: async () => {
    await limparSessao();
    set({ paciente: null, medico: null });
  },
}));