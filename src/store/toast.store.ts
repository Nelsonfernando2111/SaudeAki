import { create } from 'zustand';

export type TipoToast = 'sucesso' | 'erro' | 'info';

export interface Toast {
  id: number;
  tipo: TipoToast;
  mensagem: string;
}

interface ToastState {
  atual: Toast | null;
  mostrar: (tipo: TipoToast, mensagem: string) => void;
  esconder: (id: number) => void;
}

let proximoId = 1;

export const useToastStore = create<ToastState>((set, get) => ({
  atual: null,
  mostrar: (tipo, mensagem) => set({ atual: { id: proximoId++, tipo, mensagem } }),
  esconder: (id) => {
    if (get().atual?.id === id) set({ atual: null });
  },
}));

/** Atalhos utilizáveis fora de componentes */
export const toast = {
  sucesso: (m: string) => useToastStore.getState().mostrar('sucesso', m),
  erro: (m: string) => useToastStore.getState().mostrar('erro', m),
  info: (m: string) => useToastStore.getState().mostrar('info', m),
};
