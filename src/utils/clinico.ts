import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type {
  CategoriaExame,
  ClassificacaoResultado,
  CondutaAlergia,
  EstadoCondicao,
  Exame,
  MecanismoAlergia,
  TipoDocumento,
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
  PENDENTE: { label: 'Solicitado', cor: colors.warningText, fundo: colors.warningSoft, icone: 'clock-outline' },
  EM_ANALISE: { label: 'Em análise', cor: colors.primary, fundo: colors.primarySoft, icone: 'progress-clock' },
  REALIZADO: { label: 'Concluído', cor: colors.success, fundo: colors.successSoft, icone: 'check-circle-outline' },
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
  VERIFICAR_ALERGIAS: 'Verificou alergias antes de prescrever',
  DOCUMENTO_IDENTIDADE: 'Viu o seu documento de identidade',
};

export function descreverRecurso(recurso: string): string {
  return RECURSOS[recurso] ?? recurso;
}

export const plural = (n: number, singular: string, pluralTxt: string) =>
  `${n} ${n === 1 ? singular : pluralTxt}`;

export const TIPOS_DOCUMENTO: { valor: TipoDocumento; titulo: string }[] = [
  { valor: 'BI', titulo: 'BI' },
  { valor: 'PASSAPORTE', titulo: 'Passaporte' },
  { valor: 'DIRE', titulo: 'DIRE' },
  { valor: 'CARTA_CONDUCAO', titulo: 'Carta de condução' },
  { valor: 'CARTAO_ELEITOR', titulo: 'Cartão de eleitor' },
  { valor: 'OUTRO', titulo: 'Outro' },
];

export function nomeTipoDocumento(t?: TipoDocumento | null) {
  return TIPOS_DOCUMENTO.find((d) => d.valor === t)?.titulo ?? '—';
}

/* ---------- Condições e alergias ---------- */

export const INFO_ESTADO_CONDICAO: Record<EstadoCondicao, { label: string; cor: string; fundo: string }> = {
  ATIVA: { label: 'Ativa', cor: colors.error, fundo: colors.errorSoft },
  EM_REMISSAO: { label: 'Em remissão', cor: colors.warningText, fundo: colors.warningSoft },
  INATIVA: { label: 'Inativa', cor: colors.textSecondary, fundo: colors.border },
  RESOLVIDA: { label: 'Resolvida', cor: colors.success, fundo: colors.successSoft },
};

export const OPCOES_ESTADO_CONDICAO = (Object.keys(INFO_ESTADO_CONDICAO) as EstadoCondicao[]).map((v) => ({
  valor: v,
  titulo: INFO_ESTADO_CONDICAO[v].label,
}));

export const NOMES_MECANISMO: Record<MecanismoAlergia, string> = {
  TIPO_I_IGE: 'Tipo I (IgE)',
  TIPO_II_CITOTOXICA: 'Tipo II (citotóxica)',
  TIPO_III_IMUNOCOMPLEXOS: 'Tipo III (imunocomplexos)',
  TIPO_IV_TARDIA: 'Tipo IV (tardia)',
  INTOLERANCIA: 'Intolerância',
  EFEITO_ADVERSO: 'Efeito adverso',
  DESCONHECIDO: 'Desconhecido',
};

export const OPCOES_MECANISMO = (Object.keys(NOMES_MECANISMO) as MecanismoAlergia[]).map((v) => ({
  valor: v,
  titulo: NOMES_MECANISMO[v],
}));

export const INFO_CONDUTA: Record<CondutaAlergia, { label: string; cor: string; fundo: string }> = {
  USAR_COM_PRECAUCAO: { label: 'Usar com precaução', cor: colors.warningText, fundo: colors.warningSoft },
  SUBSTITUIR_SE_POSSIVEL: { label: 'Substituir se possível', cor: colors.warningText, fundo: colors.warningSoft },
  EVITAR: { label: 'Evitar', cor: colors.error, fundo: colors.errorSoft },
  BLOQUEIO_ABSOLUTO: { label: 'Bloqueio absoluto', cor: colors.white, fundo: colors.error },
};

export const OPCOES_CONDUTA = (Object.keys(INFO_CONDUTA) as CondutaAlergia[]).map((v) => ({
  valor: v,
  titulo: INFO_CONDUTA[v].label,
}));

/** Conduta que o servidor assume quando não é indicada */
export function condutaPorOmissao(s: SeveridadeCondicao): CondutaAlergia {
  return s === 'CRITICA' ? 'BLOQUEIO_ABSOLUTO' : s === 'MEDIA' ? 'EVITAR' : 'USAR_COM_PRECAUCAO';
}

/* ---------- Exames ---------- */

export const NOMES_CATEGORIA_EXAME: Record<CategoriaExame, string> = {
  LABORATORIAL: 'Laboratorial',
  IMAGEM: 'Imagem',
  ANATOMOPATOLOGICO: 'Anatomopatológico',
  CARDIOLOGICO: 'Cardiológico',
  OUTRO: 'Outro',
};

export const OPCOES_CATEGORIA_EXAME = (Object.keys(NOMES_CATEGORIA_EXAME) as CategoriaExame[]).map((v) => ({
  valor: v,
  titulo: NOMES_CATEGORIA_EXAME[v],
}));

export const INFO_CLASSIFICACAO: Record<ClassificacaoResultado, { label: string; cor: string; fundo: string }> = {
  NORMAL: { label: 'Normal', cor: colors.success, fundo: colors.successSoft },
  BAIXO: { label: 'Baixo', cor: colors.warningText, fundo: colors.warningSoft },
  ALTO: { label: 'Alto', cor: colors.warningText, fundo: colors.warningSoft },
  ALTERADO: { label: 'Alterado', cor: colors.error, fundo: colors.errorSoft },
  CRITICO: { label: 'Crítico', cor: colors.white, fundo: colors.error },
};
