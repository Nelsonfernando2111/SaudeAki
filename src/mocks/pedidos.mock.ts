import type { Medico, Paciente, PedidoAcesso } from '@/src/types';


export const medicoMock: Medico = {
  id: 'm1',
  nome: 'Dr. João Silva',
  email: 'joao.silva@hospital.com',
  unidadeSanitaria: 'Hospital Central',
  especialidade: 'Clínica Geral',
  numeroLicenca: 'MED-002481',
  telefone: '+258 84 123 4567',
};

/* ---------- Dados de exemplo (só para demonstração) ---------- */

// Os pendentes de exemplo duram 5 minutos para dar tempo de ver o ecrã.
// Os pedidos criados de verdade continuam com 60 segundos.
const DURACAO_DEMO_MS = 5 * 60_000;

const hojeAs = (hora: number, minuto: number) => {
  const d = new Date();
  d.setHours(hora, minuto, 0, 0);
  return d.toISOString();
};

const pendenteDemo = (
  id: string,
  paciente: Pick<Paciente, 'id' | 'codigo' | 'nome'>,
  criadoEm: string,
  segundosRestantesIniciais: number
): PedidoAcesso => ({
  id,
  medico: medicoMock,
  paciente,
  estado: 'pendente',
  criadoEm,
  expiraEm: new Date(Date.now() + Math.min(segundosRestantesIniciais * 1000 + DURACAO_DEMO_MS, DURACAO_DEMO_MS * 2)).toISOString(),
});

const resolvidoDemo = (
  id: string,
  paciente: Pick<Paciente, 'id' | 'codigo' | 'nome'>,
  estado: PedidoAcesso['estado'],
  criadoEm: string
): PedidoAcesso => ({
  id,
  medico: medicoMock,
  paciente,
  estado,
  criadoEm,
  expiraEm: new Date(new Date(criadoEm).getTime() + 60_000).toISOString(),
});

export const pedidosMock: PedidoAcesso[] = [
  pendenteDemo(
    'ped-demo1',
    { id: 'p1', codigo: 'IDCLIN-8K3U1', nome: 'Maria da Conceição' },
    hojeAs(10, 24),
    36
  ),
  pendenteDemo(
    'ped-demo2',
    { id: 'p4', codigo: 'IDCLIN-Z7F9Q', nome: 'Carlos Alberto' },
    hojeAs(9, 12),
    18
  ),
  resolvidoDemo(
    'ped-demo3',
    { id: 'p5', codigo: 'IDCLIN-2Q8J7', nome: 'Ana Paula Mendes' },
    'aprovado',
    '2025-09-12T14:32:00'
  ),
  resolvidoDemo(
    'ped-demo4',
    { id: 'p6', codigo: 'IDCLIN-6V4D3', nome: 'José Manuel' },
    'negado',
    '2025-09-10T11:20:00'
  ),
];

export function criarPedidoMock(
  paciente: Pick<Paciente, 'id' | 'codigo' | 'nome'>,
  medico: Medico = medicoMock
): PedidoAcesso {
  const agora = Date.now();
  const pedido: PedidoAcesso = {
    id: `ped${agora}`,
    medico,
    paciente: { id: paciente.id, codigo: paciente.codigo, nome: paciente.nome },
    estado: 'pendente',
    criadoEm: new Date(agora).toISOString(),
    expiraEm: new Date(agora + 60_000).toISOString(),
  };
  pedidosMock.push(pedido);
  return pedido;
}