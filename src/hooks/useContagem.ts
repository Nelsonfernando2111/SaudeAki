import { useEffect, useState } from 'react';

/** Devolve os segundos que faltam até `expiraEm` (ISO). */
export function useContagem(expiraEm?: string | null) {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    if (!expiraEm) return;
    const timer = setInterval(() => setAgora(Date.now()), 500);
    return () => clearInterval(timer);
  }, [expiraEm]);

  if (!expiraEm) return 0;
  return Math.max(0, Math.ceil((new Date(expiraEm).getTime() - agora) / 1000));
}
