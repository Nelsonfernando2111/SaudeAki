export type Perfil = 'medico' | 'paciente';

export interface Alergia {
  id: string;
  nome: string;
  desde?: string;
}

export interface CondicaoCronica {
  id: string;
  nome: string;
  desde?: string;
}

export interface Medicacao {
  id: string;
  nome: string;
  posologia: string; // ex: "1x ao dia"
}

export interface ParametroExame {
  parametro: string;
  resultado: string;
}

export interface Exame {
  id: string;
  nome: string;
  data: string; // ISO
  laboratorio?: string;
  parametros?: ParametroExame[];
}

export interface Paciente {
  id: string;
  codigo: string; // ex: IDCLIN-4F9T2
  nome: string;
  email?: string;
  telefone?: string;
  ativo: boolean;
  tipoSanguineo: string;
  alergias: Alergia[];
  condicoesCronicas: CondicaoCronica[];
  medicacaoAtiva: Medicacao[];
  exames: Exame[];
}

export interface Medico {
  id: string;
  nome: string;
  email: string;
  unidadeSanitaria: string;
  especialidade?: string;
  numeroLicenca?: string;
  telefone?: string;
}

export type EstadoPedido = 'pendente' | 'aprovado' | 'negado' | 'expirado' | 'cancelado';

export interface PedidoAcesso {
  id: string;
  medico: Medico;
  paciente: Pick<Paciente, 'id' | 'codigo' | 'nome'>;
  estado: EstadoPedido;
  criadoEm: string; // ISO
  expiraEm: string; // ISO (60 segundos)
}

export type TipoAcesso = 'completo' | 'emergencia';

export interface RegistoAcesso {
  id: string;
  medico: Medico;
  tipo: TipoAcesso;
  data: string; // ISO
}
export interface Consulta {
  id: string;
  paciente: Pick<Paciente, 'id' | 'codigo' | 'nome'>;
  tipo: TipoAcesso;
  data: string; // ISO
}