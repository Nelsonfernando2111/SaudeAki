import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { EstadoPedido, PedidoAcesso } from '@/src/types';
import { colors } from '@/src/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Um pedido PENDENTE cujo prazo já passou conta como EXPIRADO */
export function estadoEfetivo(p: Pick<PedidoAcesso, 'estado' | 'dataExpiracao'>): EstadoPedido {
  if (p.estado === 'PENDENTE' && Date.now() >= new Date(p.dataExpiracao).getTime()) {
    return 'EXPIRADO';
  }
  return p.estado;
}

/** Duração da sessão de acesso completo criada ao aprovar */
export const DURACAO_SESSAO_MS = 30 * 60 * 1000;

/** O médico ainda tem (provavelmente) sessão ativa graças a este pedido aprovado? */
export function sessaoProvavelmenteAtiva(p: PedidoAcesso): boolean {
  if (p.estado !== 'APROVADO' || !p.dataResposta) return false;
  return Date.now() < new Date(p.dataResposta).getTime() + DURACAO_SESSAO_MS;
}

export const INFO_ESTADO: Record<
  EstadoPedido,
  { label: string; cor: string; fundo: string; icone: IconName }
> = {
  PENDENTE: {
    label: 'Pendente',
    cor: colors.warningText,
    fundo: colors.warningSoft,
    icone: 'clock-outline',
  },
  APROVADO: {
    label: 'Aprovado',
    cor: colors.success,
    fundo: colors.successSoft,
    icone: 'check-circle-outline',
  },
  RECUSADO: {
    label: 'Recusado',
    cor: colors.error,
    fundo: colors.errorSoft,
    icone: 'close-circle-outline',
  },
  EXPIRADO: {
    label: 'Expirado',
    cor: colors.textSecondary,
    fundo: colors.border,
    icone: 'clock-alert-outline',
  },
};

/** Um registo por paciente (o pedido mais recente), pela ordem da lista */
export function pacientesRecentes(pedidos: PedidoAcesso[]): PedidoAcesso[] {
  const vistos = new Set<string>();
  return pedidos.filter((p) => {
    if (vistos.has(p.pacienteId)) return false;
    vistos.add(p.pacienteId);
    return true;
  });
}
