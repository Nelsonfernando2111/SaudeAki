import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { paraErroApi, type ErroApi } from '@/src/services/api';

interface Opcoes {
  /** Volta a carregar (sem skeleton) sempre que o ecrã ganha foco */
  aoFocar?: boolean;
  /** Não carrega enquanto for false */
  ativo?: boolean;
}

/**
 * Carrega dados de um service e expõe os estados para skeleton,
 * pull-to-refresh e mensagens de erro. `deps` deve ter valores simples (ids, strings).
 */
export function useRecurso<T>(carregar: () => Promise<T>, deps: unknown[], opcoes: Opcoes = {}) {
  const { aoFocar = false, ativo = true } = opcoes;
  const chave = JSON.stringify(deps);

  const [dados, setDados] = useState<T | null>(null);
  const [erro, setErro] = useState<ErroApi | null>(null);
  /** Chave dos deps já carregados: enquanto for diferente, está "a carregar" */
  const [chaveCarregada, setChaveCarregada] = useState<string | null>(null);
  const [aAtualizar, setAAtualizar] = useState(false);

  const carregarRef = useRef(carregar);
  useLayoutEffect(() => {
    carregarRef.current = carregar;
  });
  const pedidoAtual = useRef(0);

  const executar = useCallback(async (paraChave: string) => {
    const n = ++pedidoAtual.current;
    try {
      const resultado = await carregarRef.current();
      if (n !== pedidoAtual.current) return;
      setDados(resultado);
      setErro(null);
    } catch (e) {
      if (n !== pedidoAtual.current) return;
      setErro(paraErroApi(e));
    } finally {
      if (n === pedidoAtual.current) {
        setChaveCarregada(paraChave);
        setAAtualizar(false);
      }
    }
  }, []);

  useEffect(() => {
    if (ativo) executar(chave);
  }, [ativo, chave, executar]);

  const chaveRef = useRef(chave);
  const carregadaRef = useRef(chaveCarregada);
  useLayoutEffect(() => {
    chaveRef.current = chave;
    carregadaRef.current = chaveCarregada;
  });

  useFocusEffect(
    useCallback(() => {
      // Só recarrega em silêncio depois do primeiro carregamento
      if (aoFocar && ativo && carregadaRef.current === chaveRef.current) executar(chaveRef.current);
    }, [aoFocar, ativo, executar])
  );

  return {
    dados,
    setDados,
    erro,
    carregando: ativo && chaveCarregada !== chave,
    aAtualizar,
    /** Para o RefreshControl */
    atualizar: () => {
      setAAtualizar(true);
      executar(chave);
    },
    /** Recarrega sem indicadores */
    recarregar: () => executar(chave),
  };
}
