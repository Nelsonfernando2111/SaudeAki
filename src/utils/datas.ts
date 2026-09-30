import { format, isToday, isYesterday, parseISO } from 'date-fns';

/** "2025-09-12" -> "12/09/2025" */
export function formatarData(iso: string): string {
  try {
    return format(parseISO(iso), 'dd/MM/yyyy');
  } catch {
    return iso;
  }
}
/** "2025-09-12T10:24:00" -> "12/09/2025 · 10:24" */
export function formatarDataHora(iso: string): string {
  try {
    return format(parseISO(iso), 'dd/MM/yyyy · HH:mm');
  } catch {
    return iso;
  }
}
/** ISO -> "10:24" */
export function formatarHora(iso: string): string {
  try {
    return format(parseISO(iso), 'HH:mm');
  } catch {
    return iso;
  }
}

/** ISO -> "Hoje · 10:24" | "Ontem · 16:33" | "12/09/2025 · 14:32" */
export function formatarDiaRelativo(iso: string): string {
  try {
    const d = parseISO(iso);
    const hora = format(d, 'HH:mm');
    if (isToday(d)) return `Hoje · ${hora}`;
    if (isYesterday(d)) return `Ontem · ${hora}`;
    return format(d, 'dd/MM/yyyy · HH:mm');
  } catch {
    return iso;
  }
}