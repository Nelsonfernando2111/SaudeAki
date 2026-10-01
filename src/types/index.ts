/* =====================================================================
 * Tipos da API IDCLIN / txunaSaude (ver documentação da API)
 * ===================================================================== */

/** Perfil usado pela app (só paciente e médico têm interface) */
export type Perfil = 'medico' | 'paciente';

export type Role = 'PACIENTE' | 'MEDICO' | 'ENFERMEIRO' | 'RECEPCIONISTA' | 'ADMIN';

/* ---------- Enums ---------- */

export type GrupoSanguineo = 'A' | 'B' | 'AB' | 'O';
export type FatorRh = 'POSITIVO' | 'NEGATIVO';
export type TipoCondicaoMedica = 'ALERGIA' | 'DOENCA_CRONICA';
export type SeveridadeCondicao = 'BAIXA' | 'MEDIA' | 'CRITICA';
export type StatusExame = 'PENDENTE' | 'REALIZADO' | 'CANCELADO';
export type EstadoPedido = 'PENDENTE' | 'APROVADO' | 'RECUSADO' | 'EXPIRADO';
export type TipoAcesso = 'EMERGENCIA' | 'COMPLETO';
export type EstadoSessao = 'ATIVA' | 'REVOGADA' | 'EXPIRADA';

/* ---------- Genéricos ---------- */

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}

/** Corpo de erro devolvido pela API em respostas 4xx/5xx */
export interface CorpoErroApi {
  timestamp?: string;
  status?: number;
  erro?: string;
  mensagem?: string;
  detalhes?: string[] | null;
}

/* ---------- Autenticação ---------- */

export interface RespostaLogin {
  accessToken: string;
  refreshToken: string;
  id: string;
  nomeCompleto: string;
  role: Role;
}

export interface DadosRegisto {
  nomeCompleto: string;
  senha: string;
  telefone: string;
  dataNascimento?: string; // yyyy-MM-dd
  genero?: string;
  cidade?: string;
  contactoEmergencia?: string;
  grupoSanguineo?: GrupoSanguineo;
  fatorRh?: FatorRh;
}

/* ---------- Paciente ---------- */

export interface Paciente {
  id: string;
  codUnico: string; // PAC-XXXX
  nomeCompleto: string;
  telefone: string;
  dataNascimento: string | null;
  genero: string | null;
  grupoSanguineo: GrupoSanguineo | null;
  fatorRh: FatorRh | null;
  cidade: string | null;
  contactoEmergencia: string | null;
  criadoEm: string;
}

export type AtualizacaoPaciente = Partial<
  Pick<
    Paciente,
    | 'nomeCompleto'
    | 'telefone'
    | 'dataNascimento'
    | 'genero'
    | 'cidade'
    | 'contactoEmergencia'
    | 'grupoSanguineo'
    | 'fatorRh'
  >
>;

export interface CondicaoMedica {
  id: number;
  pacienteId: string;
  pacienteNome: string;
  tipo: TipoCondicaoMedica;
  descricao: string;
  severidade: SeveridadeCondicao;
  registradoEm: string;
}

export interface DadosCondicao {
  tipo: TipoCondicaoMedica;
  descricao: string;
  severidade: SeveridadeCondicao;
}

export interface ResultadoExame {
  id?: number;
  nomeParametro: string;
  valor: string;
  unidadeMedida?: string | null;
  valorReferencia?: string | null;
}

export interface Exame {
  id: number;
  pacienteId: string;
  pacienteNome: string;
  medicoResponsavelId: string | null;
  medicoResponsavelNome: string | null;
  unidadeSanitariaId: number | null;
  unidadeSanitariaNome: string | null;
  tipoExame: string;
  dataSolicitado: string | null;
  dataRealizado: string | null;
  status?: StatusExame;
  /** Na resposta chama-se `resultado` (singular) */
  resultado: ResultadoExame[];
}

export interface DadosExame {
  tipoExame?: string;
  unidadeSanitariaId?: number;
  dataSolicitado?: string; // yyyy-MM-ddTHH:mm:ss
  dataRealizado?: string;
  status?: StatusExame;
  /** No pedido chama-se `resultados` (plural) */
  resultados?: Omit<ResultadoExame, 'id'>[];
}

export interface AnexoExame {
  id: number;
  exameId: number;
  descricao: string | null;
  nomeArquivo: string;
  contentType: string;
  tamanhoBytes: number;
  url: string; // "/api/exames/fotos/1"
  criadoEm: string;
}

export interface Prescricao {
  id: number;
  pacienteId: string;
  pacienteNome: string;
  medicoId: string | null;
  medicoNome: string | null;
  nomeMedicamento: string;
  dosagem: string | null;
  frequencia: string | null;
  duracao: string | null;
  ativa: boolean;
  dataPrescricao: string;
}

export interface DadosPrescricao {
  nomeMedicamento?: string;
  dosagem?: string;
  frequencia?: string;
  duracao?: string;
  ativa?: boolean;
}

export interface HistoricoClinico {
  paciente: Paciente;
  condicoes: CondicaoMedica[];
  exames: Exame[];
  prescricoes: Prescricao[];
}

export interface MedicacaoEmergencia {
  id: number;
  nomeMedicamento: string;
  dosagem: string | null;
  frequencia: string | null;
  duracao: string | null;
}

export interface FichaEmergencia {
  codUnicoPaciente: string;
  nomeCompleto: string;
  tipoSanguineo: { grupoSanguineo: GrupoSanguineo | null; fatorRh: FatorRh | null } | null;
  alergias: CondicaoMedica[];
  condicoesCronicas: CondicaoMedica[];
  medicacaoAtiva: MedicacaoEmergencia[];
}

/* ---------- Médico e unidades ---------- */

export interface Medico {
  id: string;
  nomeCompleto: string;
  email: string;
  numeroOrdem: string;
  especialidade: string | null;
  telefone: string | null;
  unidadeSanitariaId: number | null;
  unidadeSanitariaNome: string | null;
  criadoEm: string;
}

export type AtualizacaoMedico = Partial<{
  nomeCompleto: string;
  telefone: string;
  especialidade: string;
  unidadeSanitariaId: number;
}>;

export interface UnidadeSanitaria {
  id: number;
  nome: string;
  provincia: string | null;
  cidade: string | null;
  tipo: string | null;
  criadoEm: string;
}

/* ---------- Pedidos, sessões e auditoria ---------- */

/** Devolvido na criação, na listagem e enviado ao paciente por WebSocket */
export interface PedidoAcesso {
  id: number;
  medicoNome: string;
  unidadeSanitariaNome: string | null;
  pacienteId: string;
  pacienteNome: string;
  estado: EstadoPedido;
  dataPedido: string;
  dataResposta: string | null;
  dataExpiracao: string;
}

/** Devolvido por aprovar/negar e enviado ao médico por WebSocket */
export interface PedidoAcessoResumo {
  id: number;
  medicoId: string;
  medicoNome: string;
  pacienteId: string;
  estado: EstadoPedido;
  dataPedido: string;
  dataResposta: string | null;
}

export interface SessaoAcesso {
  id: number;
  pedidoId: number;
  medicoId: string;
  medicoNome: string;
  unidadeSanitariaNome: string | null;
  pacienteId: string;
  estado: EstadoSessao;
  dataConcessao: string;
  dataExpiracao: string;
}

export interface RegistoAcesso {
  id: number;
  medicoId: string;
  medicoNome: string;
  unidadeSanitariaNome: string | null;
  tipoAcesso: TipoAcesso;
  recurso: string;
  dataAcesso: string;
}
