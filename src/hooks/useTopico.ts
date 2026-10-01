import { useEffect, useLayoutEffect, useRef } from 'react';
import { subscrever } from '@/src/services/realtime';

/** Subscreve um tópico STOMP enquanto o componente estiver montado. `null` não subscreve. */
export function useTopico<T>(destino: string | null, aoReceber: (mensagem: T) => void) {
  const ref = useRef(aoReceber);
  useLayoutEffect(() => {
    ref.current = aoReceber;
  });

  useEffect(() => {
    if (!destino) return;
    return subscrever<T>(destino, (m) => ref.current(m));
  }, [destino]);
}
