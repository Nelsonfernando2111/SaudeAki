import type { Medico, RegistoAcesso, TipoAcesso } from '@/src/types';

const medicos: Record<string, Medico> = {
  joao: { id: 'm1', nome: 'Dr. João Silva', email: 'joao.silva@hospital.com', unidadeSanitaria: 'Hospital Central' },
  ana: { id: 'm2', nome: 'Dra. Ana Costa', email: 'ana.costa@clinicavida.com', unidadeSanitaria: 'Clínica Vida' },
  pedro: { id: 'm3', nome: 'Dr. Pedro Mendes', email: 'pedro.mendes@hospital.com', unidadeSanitaria: 'Hospital Central' },
  sofia: { id: 'm4', nome: 'Dra. Sofia Almeida', email: 'sofia.almeida@saude.com', unidadeSanitaria: 'Centro de Saúde' },
};

/** Registos de acesso por id de paciente */
export const acessosMock: Record<string, RegistoAcesso[]> = {
  p1: [
    { id: 'ac1', medico: medicos.joao, tipo: 'completo', data: '2025-09-12T10:24:00' },
    { id: 'ac2', medico: medicos.ana, tipo: 'emergencia', data: '2025-09-08T14:32:00' },
    { id: 'ac3', medico: medicos.pedro, tipo: 'completo', data: '2025-09-02T09:17:00' },
    { id: 'ac4', medico: medicos.sofia, tipo: 'emergencia', data: '2025-08-28T16:03:00' },
  ],
    p2: [
    { id: 'ac5', medico: medicos.joao, tipo: 'completo', data: '2025-09-10T11:20:00' },
  ],
  p3: [
    { id: 'ac6', medico: medicos.joao, tipo: 'emergencia', data: '2025-09-09T16:33:00' },
  ],
};

export function adicionarAcessoMock(pacienteId: string, medico: Medico, tipo: TipoAcesso) {
  const registo: RegistoAcesso = {
    id: `ac${Date.now()}`,
    medico,
    tipo,
    data: new Date().toISOString(),
  };
  acessosMock[pacienteId] = [registo, ...(acessosMock[pacienteId] ?? [])];
}