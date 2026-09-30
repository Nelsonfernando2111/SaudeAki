import type { Paciente } from '@/src/types';

export type PacienteMock = Paciente & { senha: string };

export const pacientesMock: PacienteMock[] = [
  {
    id: 'p1',
    codigo: 'IDCLIN-4F9T2',
    nome: 'Nelson Basílio Fernando',
    email: 'nelson@email.com',
    telefone: '841234567',
    senha: '123456',
    ativo: true,
    tipoSanguineo: 'O+',
    alergias: [
      { id: 'a1', nome: 'Penicilina', desde: '2021' },
      { id: 'a2', nome: 'Pólen' },
    ],
    condicoesCronicas: [{ id: 'c1', nome: 'Hipertensão Arterial', desde: '2022' }],
    medicacaoAtiva: [
      { id: 'm1', nome: 'Losartana 50mg', posologia: '1x ao dia' },
    ],
    exames: [
      {
        id: 'e1',
        nome: 'Hemograma completo',
        data: '2025-09-12',
        laboratorio: 'Laboratório Central',
        parametros: [
          { parametro: 'Hemoglobina', resultado: '14,2 g/dL' },
          { parametro: 'Leucócitos', resultado: '6.800 /µL' },
          { parametro: 'Plaquetas', resultado: '220.000 /µL' },
          { parametro: 'Glicose', resultado: '95 mg/dL' },
        ],
      },
      { id: 'e2', nome: 'Raio-X Tórax', data: '2025-09-03' },
    ],
  },
  {
    id: 'p2',
    codigo: 'IDCLIN-8K3D1',
    nome: 'Maria da Conceição',
    telefone: '842345678',
    senha: '123456',
    ativo: true,
    tipoSanguineo: 'A+',
    alergias: [],
    condicoesCronicas: [],
    medicacaoAtiva: [],
    exames: [],
  },
  {
    id: 'p3',
    codigo: 'IDCLIN-7Z6P4',
    nome: 'João Manuel',
    telefone: '843456789',
    senha: '123456',
    ativo: true,
    tipoSanguineo: 'B+',
    alergias: [],
    condicoesCronicas: [],
    medicacaoAtiva: [],
    exames: [],
  },
];