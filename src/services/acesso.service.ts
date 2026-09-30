import { api } from './api';
import { acessosMock } from '@/src/mocks/acessos.mock';
import { pacientesMock } from '@/src/mocks/pacientes.mock';
import type { Consulta, RegistoAcesso } from '@/src/types';

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function obterAcessos(pacienteId: string): Promise<RegistoAcesso[]> {
  try {
    const { data } = await api.get<RegistoAcesso[]>(`/pacientes/${pacienteId}/acessos`);
    return data;
  } catch {
    await esperar(300);
    const lista = acessosMock[pacienteId] ?? [];
    return [...lista].sort((a, b) => b.data.localeCompare(a.data));
  }
}
/** Últimos pacientes consultados por um médico (um registo por paciente) */
export async function listarConsultasMedico(medicoId: string): Promise<Consulta[]> {
  try {
    const { data } = await api.get<Consulta[]>(`/medicos/${medicoId}/consultas`);
    return data;
  } catch {
    await esperar(250);
    const todas: Consulta[] = [];

    for (const [pacienteId, registos] of Object.entries(acessosMock)) {
      const paciente = pacientesMock.find((p) => p.id === pacienteId);
      if (!paciente) continue;
      registos
        .filter((r) => r.medico.id === medicoId)
        .forEach((r) =>
          todas.push({
            id: r.id,
            paciente: { id: paciente.id, codigo: paciente.codigo, nome: paciente.nome },
            tipo: r.tipo,
            data: r.data,
          })
        );
    }

    todas.sort((a, b) => b.data.localeCompare(a.data));
    const vistos = new Set<string>();
    return todas.filter((c) => {
      if (vistos.has(c.paciente.id)) return false;
      vistos.add(c.paciente.id);
      return true;
    });
  }
}