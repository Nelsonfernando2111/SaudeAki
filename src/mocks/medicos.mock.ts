import type { Medico } from '@/src/types';

export type MedicoMock = Medico & { senha: string };

export const medicosMock: MedicoMock[] = [
  {
    id: 'm1',
    nome: 'Dr. João Silva',
    email: 'joao.silva@hospital.com',
    unidadeSanitaria: 'Hospital Central',
    especialidade: 'Clínica Geral',
    numeroLicenca: 'MED-002481',
    telefone: '+258 84 123 4567',
    senha: '123456',
  },
  {
    id: 'm2',
    nome: 'Dra. Ana Costa',
    email: 'ana.costa@clinicavida.com',
    unidadeSanitaria: 'Clínica Vida',
    especialidade: 'Cardiologia',
    numeroLicenca: 'MED-001937',
    telefone: '+258 84 765 4321',
    senha: '123456',
  },
];