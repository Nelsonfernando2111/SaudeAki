import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type {
  Exame,
  FatorRh,
  GrupoSanguineo,
  SeveridadeCondicao,
  StatusExame,
} from '@/src/types';
import { colors } from '@/src/theme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/** "O" + "POSITIVO" -> "O+" ; sem dados -> "Não indicado" */
export function tipoSanguineo(grupo?: GrupoSanguineo | null, rh?: FatorRh | null): string {
  if (!grupo) return 'Não indicado';
  if (!rh) return grupo;
  return `${grupo}${rh === 'POSITIVO' ? '+' : '−'}`;
}

export const INFO_SEVERIDADE: Record<SeveridadeCondicao, { label: string; cor: string; fundo: string }> =
  {
    BAIXA: { label: 'Baixa', cor: colors.success, fundo: colors.successSoft },
    MEDIA: { label: 'Média', cor: colors.warningText, fundo: colors.warningSoft },
    CRITICA: { label: 'Crítica', cor: colors.error, fundo: colors.errorSoft },
  };

export const INFO_STATUS_EXAME: Record<
  StatusExame,
  { label: string; cor: string; fundo: string; icone: IconName }
> = {
  PENDENTE: { label: 'Pendente', cor: colors.warningText, fundo: colors.warningSoft, icone: 'clock-outline' },
  REALIZADO: { label: 'Realizado', cor: colors.success, fundo: colors.successSoft, icone: 'check-circle-outline' },
  CANCELADO: { label: 'Cancelado', cor: colors.textSecondary, fundo: colors.border, icone: 'cancel' },
};

/** A resposta pode não trazer `status`: deduz pela data de realização */
export function statusExame(e: Pick<Exame, 'status' | 'dataRealizado'>): StatusExame {
  return e.status ?? (e.dataRealizado ? 'REALIZADO' : 'PENDENTE');
}

/** Data mais relevante de um exame (para ordenar e mostrar) */
export function dataExame(e: Pick<Exame, 'dataRealizado' | 'dataSolicitado'>): string {
  return e.dataRealizado ?? e.dataSolicitado ?? '';
}

export function posologia(p: { dosagem?: string | null; frequencia?: string | null; duracao?: string | null }) {
  return [p.dosagem, p.frequencia, p.duracao].filter(Boolean).join(' · ') || 'Sem posologia';
}

/** Nome legível do recurso consultado (auditoria) */
const RECURSOS: Record<string, string> = {
  EMERGENCIA: 'Consultou a ficha de emergência',
  HISTORICO: 'Consultou o histórico completo',
  CONDICOES: 'Consultou condições e alergias',
  EXAMES: 'Consultou os exames',
  EXAME: 'Consultou um exame',
  PRESCRICOES: 'Consultou as prescrições',
  PRESCRICOES_ATIVAS: 'Consultou a medicação ativa',
  NOVA_CONDICAO: 'Registou uma condição',
  ATUALIZAR_CONDICAO: 'Atualizou uma condição',
  REMOVER_CONDICAO: 'Removeu uma condição',
  NOVO_EXAME: 'Registou um exame',
  ATUALIZAR_EXAME: 'Atualizou um exame',
  CANCELAR_EXAME: 'Cancelou um exame',
  NOVO_ANEXO_EXAME: 'Anexou um ficheiro a um exame',
  REMOVER_ANEXO_EXAME: 'Removeu um anexo de exame',
  NOVA_PRESCRICAO: 'Registou uma prescrição',
  ATUALIZAR_PRESCRICAO: 'Atualizou uma prescrição',
  ANEXOS_EXAME: 'Consultou os anexos de um exame',
  ANEXO_EXAME: 'Abriu um anexo de exame',
};

export function descreverRecurso(recurso: string): string {
  return RECURSOS[recurso] ?? recurso;
}

export const plural = (n: number, singular: string, pluralTxt: string) =>
  `${n} ${n === 1 ? singular : pluralTxt}`;
