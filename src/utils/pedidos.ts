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

