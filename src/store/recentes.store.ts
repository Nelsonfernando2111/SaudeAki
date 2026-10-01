import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface PacienteRecente {
  /** UUID ou código único (ambos servem nos caminhos da API) */
  id: string;
  codUnico: string;
  nome: string;
  vistoEm: string; // ISO
}

const MAXIMO = 15;

/** Últimos pacientes abertos pelo médico neste telemóvel */
interface RecentesState {
  pacientes: PacienteRecente[];
  registar: (p: Omit<PacienteRecente, 'vistoEm'>) => void;
  limpar: () => void;
}

export const useRecentesStore = create<RecentesState>()(
  persist(
    (set) => ({
      pacientes: [],
      registar: (p) =>
        set((s) => ({
          pacientes: [
            { ...p, vistoEm: new Date().toISOString() },
            ...s.pacientes.filter((x) => x.codUnico !== p.codUnico),
          ].slice(0, MAXIMO),
        })),
      limpar: () => set({ pacientes: [] }),
    }),
    { name: '@saudeid:recentes', storage: createJSONStorage(() => AsyncStorage) }
  )
);
