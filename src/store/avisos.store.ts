import { create } from 'zustand';
import type { PedidoAcesso } from '@/src/types';

/** Pedidos de acesso pendentes do paciente (mostrados no sino do cabeçalho) */
interface AvisosState {
  pedidosPendentes: PedidoAcesso[];
  definirPedidosPendentes: (p: PedidoAcesso[]) => void;
}

export const useAvisosStore = create<AvisosState>((set) => ({
  pedidosPendentes: [],
  definirPedidosPendentes: (pedidosPendentes) => set({ pedidosPendentes }),
}));
