/* =====================================================================
 * Tipos da API SaudeId / txunaSaude (ver documentação da API)
 * ===================================================================== */

/** Perfil usado pela app (só paciente e médico têm interface) */
export type Perfil = 'medico' | 'paciente';

export type Role = 'PACIENTE' | 'MEDICO' | 'ENFERMEIRO' | 'RECEPCIONISTA' | 'ADMIN';

/* ---------- Enums ---------- */

export type GrupoSanguineo = 'A' | 'B' | 'AB' | 'O';
export type FatorRh = 'POSITIVO' | 'NEGATIVO';
export type TipoCondicaoMedica = 'ALERGIA' | 'DOENCA_CRONICA';
export type SeveridadeCondicao = 'BAIXA' | 'MEDIA' | 'CRITICA';
/** PENDENTE = solicitado · REALIZADO = concluído */
export type StatusExame = 'PENDENTE' | 'EM_ANALISE' | 'REALIZADO' | 'CANCELADO';
export type EstadoCondicao = 'ATIVA' | 'EM_REMISSAO' | 'INATIVA' | 'RESOLVIDA';
export type MecanismoAlergia =
  | 'TIPO_I_IGE'
  | 'TIPO_II_CITOTOXICA'
  | 'TIPO_III_IMUNOCOMPLEXOS'
  | 'TIPO_IV_TARDIA'
  | 'INTOLERANCIA'
  | 'EFEITO_ADVERSO'
  | 'DESCONHECIDO';
export type CondutaAlergia = 'USAR_COM_PRECAUCAO' | 'SUBSTITUIR_SE_POSSIVEL' | 'EVITAR' | 'BLOQUEIO_ABSOLUTO';
export type CategoriaExame = 'LABORATORIAL' | 'IMAGEM' | 'ANATOMOPATOLOGICO' | 'CARDIOLOGICO' | 'OUTRO';
export type ClassificacaoResultado = 'NORMAL' | 'BAIXO' | 'ALTO' | 'ALTERADO' | 'CRITICO';
export type EstadoPedido = 'PENDENTE' | 'APROVADO' | 'RECUSADO' | 'EXPIRADO';
export type TipoAcesso = 'EMERGENCIA' | 'COMPLETO';
export type EstadoSessao = 'ATIVA' | 'REVOGADA' | 'EXPIRADA';
export type TipoDocumento = 'BI' | 'PASSAPORTE' | 'DIRE' | 'CARTA_CONDUCAO' | 'CARTAO_ELEITOR' | 'OUTRO';

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
  dataNascimento: string; // yyyy-MM-dd, no passado
  genero: string;
  contactoEmergencia: string;
  cidade?: string;
  grupoSanguineo?: GrupoSanguineo;
  fatorRh?: FatorRh;
  /** Vêm sempre juntos */
  tipoDocumento?: TipoDocumento;
  numeroDocumento?: string;
}

/** Ficheiro escolhido no telemóvel (câmara, galeria ou documento) */
export interface ArquivoLocal {
  uri: string;
  nome: string;
  tipo: string;
  tamanho?: number;
}

/* ---------- Paciente ---------- */

export interface Paciente {
  id: string;
  codUnico: string; // PAC-XXXX
  nomeCompleto: string;
  telefone: string;
  dataNascimento: string | null;
  /** Calculada a partir de dataNascimento */
  idade?: number | null;
  genero: string | null;
  grupoSanguineo: GrupoSanguineo | null;
  fatorRh: FatorRh | null;
  cidade: string | null;
  contactoEmergencia: string | null;
  tipoDocumento?: TipoDocumento | null;
  numeroDocumento?: string | null;
  /** Ex.: "/api/pacientes/PAC-GN5U/documento-identidade"; null sem ficheiro */
  documentoIdentidadeUrl?: string | null;
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
    | 'tipoDocumento'
    | 'numeroDocumento'
  >
>;

/** Campos só usados quando tipo = ALERGIA */
export interface CamposAlergia {
  agente?: string | null;
  classeFarmacologica?: string | null;
  mecanismo?: MecanismoAlergia | null;
  reacaoObservada?: string | null;
  conduta?: CondutaAlergia | null;
}

export interface CondicaoMedica extends CamposAlergia {
  id: number;
  pacienteId: string;
  pacienteNome: string;
  tipo: TipoCondicaoMedica;
  descricao: string;
  severidade: SeveridadeCondicao;
  /** Registos antigos sem estado aparecem como ATIVA */
  estado?: EstadoCondicao | null;
  codigoCid?: string | null;
  dataInicio?: string | null; // yyyy-MM-dd
  dataFim?: string | null;
  observacoes?: string | null;
  registadoPorId?: string | null;
  registadoPorNome?: string | null;
  registradoEm: string;
  atualizadoEm?: string | null;
}

export interface DadosCondicao extends CamposAlergia {
  tipo: TipoCondicaoMedica;
  descricao: string;
  severidade: SeveridadeCondicao;
  estado?: EstadoCondicao;
  codigoCid?: string;
  dataInicio?: string;
  dataFim?: string;
  observacoes?: string;
}

export interface ResultadoExame {
  id?: number;
  nomeParametro: string;
  valor: string;
  unidadeMedida?: string | null;
  valorReferencia?: string | null;
  /** Calculada pelo servidor se não vier (referência numérica) */
  classificacao?: ClassificacaoResultado | null;
  /** Só na resposta; null se não foi possível classificar */
  anormal?: boolean | null;
}

export interface CamposLaudo {
  categoria?: CategoriaExame | null;
  codigo?: string | null;
  indicacaoClinica?: string | null;
  achados?: string | null;
  conclusao?: string | null;
  responsavelLaudoNome?: string | null;
  responsavelLaudoNumeroOrdem?: string | null;
}

export interface Exame extends CamposLaudo {
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
  temResultadoAnormal?: boolean;
}

export interface DadosExame {
  tipoExame?: string;
  categoria?: CategoriaExame;
  codigo?: string;
  indicacaoClinica?: string;
  unidadeSanitariaId?: number;
  dataSolicitado?: string; // yyyy-MM-ddTHH:mm:ss
  dataRealizado?: string;
  status?: StatusExame;
  /** No pedido chama-se `resultados` (plural) */
  resultados?: Omit<ResultadoExame, 'id' | 'anormal'>[];
  achados?: string;
  conclusao?: string;
  responsavelLaudoNome?: string;
  responsavelLaudoNumeroOrdem?: string;
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

/** Conflito entre um medicamento e uma alergia do paciente */
export interface AlertaAlergia {
  condicaoId: number;
  alergia: string;
  classeFarmacologica: string | null;
  motivo: 'MESMO_AGENTE' | 'MESMA_CLASSE';
  severidade: SeveridadeCondicao;
  mecanismo: MecanismoAlergia | null;
  reacaoObservada: string | null;
  conduta: CondutaAlergia;
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
  classeFarmacologica?: string | null;
  ativa: boolean;
  dataPrescricao: string;
  /** Só na resposta de criar/atualizar, quando há avisos que permitem prescrever */
  alertasAlergia?: AlertaAlergia[] | null;
}

export interface DadosPrescricao {
  nomeMedicamento?: string;
  dosagem?: string;
  frequencia?: string;
  duracao?: string;
  classeFarmacologica?: string;
  ativa?: boolean;
  /** true para prescrever apesar de uma alergia com conduta EVITAR */
  confirmarAlertaAlergia?: boolean;
}

export interface HistoricoClinico {
  /** Destaques no topo */
  diabetico?: boolean;
  temMedicacaoAtiva?: boolean;
  /** Subconjunto de `prescricoes` com ativa: true */
  medicacaoAtiva?: Prescricao[];
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
  diabetico?: boolean;
  contactoEmergencia?: string | null;
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
