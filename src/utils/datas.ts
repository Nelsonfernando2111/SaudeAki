import { format, isToday, isYesterday, parseISO } from 'date-fns';

function ler(iso: string) {
  return parseISO(iso);
}

/** "2025-09-12" -> "12/09/2025" */
export function formatarData(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return format(ler(iso), 'dd/MM/yyyy');
  } catch {
    return iso;
  }
}

/** "2025-09-12T10:24:00" -> "12/09/2025 · 10:24" */
export function formatarDataHora(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return format(ler(iso), 'dd/MM/yyyy · HH:mm');
  } catch {
    return iso;
  }
}

/** ISO -> "10:24" */
export function formatarHora(iso?: string | null): string {
  if (!iso) return '—';
  try {
    return format(ler(iso), 'HH:mm');
  } catch {
    return iso;
  }
}

/** ISO -> "Hoje · 10:24" | "Ontem · 16:33" | "12/09/2025 · 14:32" */
export function formatarDiaRelativo(iso?: string | null): string {
  if (!iso) return '—';
  try {
    const d = ler(iso);
    const hora = format(d, 'HH:mm');
    if (isToday(d)) return `Hoje · ${hora}`;
    if (isYesterday(d)) return `Ontem · ${hora}`;
    return format(d, 'dd/MM/yyyy · HH:mm');
  } catch {
    return iso;
  }
}

/** "12/04/1995" -> "1995-04-12" (formato da API). Devolve null se for inválida. */
export function dataParaApi(texto: string): string | null {
  const m = texto.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const [, dia, mes, ano] = m;
  const d = new Date(`${ano}-${mes}-${dia}T00:00:00`);
  if (Number.isNaN(d.getTime()) || d.getDate() !== Number(dia)) return null;
  return `${ano}-${mes}-${dia}`;
}

/** Data e hora local no formato da API: yyyy-MM-ddTHH:mm:ss */
export function agoraLocalApi(): string {
  return format(new Date(), "yyyy-MM-dd'T'HH:mm:ss");
}

/** "mm:ss" */
export function formatarContagem(segundos: number): string {
  const dd = (n: number) => String(n).padStart(2, '0');
  return `${dd(Math.floor(segundos / 60))}:${dd(segundos % 60)}`;
}
