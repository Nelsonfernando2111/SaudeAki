import { create } from 'zustand';
import type { Medico, Paciente } from '@/src/types';
import { terminarSessao } from '@/src/services/auth.service';
import { limparSessao } from '@/src/utils/sessao';
import { useAvisosStore } from './avisos.store';
import { useRecentesStore } from './recentes.store';

/** Apaga dados do utilizador anterior guardados no telemóvel */
function limparDadosLocais() {
  useRecentesStore.getState().limpar();
  useAvisosStore.getState().definirPedidosPendentes([]);
}

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
    limparDadosLocais();
    set({ paciente: null, medico: null });
  },
  limpar: async () => {
    await limparSessao();
    limparDadosLocais();
    set({ paciente: null, medico: null });
  },
}));
