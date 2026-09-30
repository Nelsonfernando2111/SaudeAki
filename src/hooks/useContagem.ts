import { useEffect, useState } from 'react';

/** Devolve os segundos que faltam até `expiraEm` (ISO). */
export function useContagem(expiraEm?: string) {
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    if (!expiraEm) return;

    const calcular = () =>
      Math.max(0, Math.ceil((new Date(expiraEm).getTime() - Date.now()) / 1000));

    setSegundos(calcular());
    const timer = setInterval(() => setSegundos(calcular()), 500);
    return () => clearInterval(timer);
  }, [expiraEm]);

  return segundos;
}