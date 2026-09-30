import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { EstadoPedido, PedidoAcesso } from '@/src/types';
import { colors } from '@/src/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

export function estadoEfetivo(p: PedidoAcesso): EstadoPedido {
  if (p.estado === 'pendente' && Date.now() >= new Date(p.expiraEm).getTime()) {
    return 'expirado';
  }
  return p.estado;
}

export const INFO_ESTADO: Record<
  EstadoPedido,
  { label: string; cor: string; fundo: string; icone: IconName }
> = {
  pendente: {
    label: 'Pendente',
    cor: colors.primary,
    fundo: colors.primarySoft,
    icone: 'clock-outline',
  },
  aprovado: {
    label: 'Aprovado',
    cor: colors.success,
    fundo: colors.successSoft,
    icone: 'check-circle-outline',
  },
  negado: {
    label: 'Negado',
    cor: colors.error,
    fundo: colors.errorSoft,
    icone: 'close-circle-outline',
  },
  expirado: {
    label: 'Expirado',
    cor: colors.warning,
    fundo: colors.warningSoft,
    icone: 'clock-alert-outline',
  },
  cancelado: {
    label: 'Cancelado',
    cor: colors.textSecondary,
    fundo: colors.border,
    icone: 'cancel',
  },
};