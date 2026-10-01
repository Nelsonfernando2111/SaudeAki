import { useCallback, useEffect, useRef, useState } from 'react';
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
 * pull-to-refresh e mensagens de erro.
 */
export function useRecurso<T>(carregar: () => Promise<T>, deps: unknown[], opcoes: Opcoes = {}) {
  const { aoFocar = false, ativo = true } = opcoes;
  const [dados, setDados] = useState<T | null>(null);
  const [erro, setErro] = useState<ErroApi | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [aAtualizar, setAAtualizar] = useState(false);

  const carregarRef = useRef(carregar);
  carregarRef.current = carregar;
  const pedidoAtual = useRef(0);
  const jaCarregou = useRef(false);

  const executar = useCallback(async (modo: 'inicial' | 'atualizar' | 'silencioso') => {
    const n = ++pedidoAtual.current;
    if (modo === 'inicial') setCarregando(true);
    if (modo === 'atualizar') setAAtualizar(true);
    try {
      const resultado = await carregarRef.current();
      if (n !== pedidoAtual.current) return;
      setDados(resultado);
      setErro(null);
      jaCarregou.current = true;
    } catch (e) {
      if (n !== pedidoAtual.current) return;
      setErro(paraErroApi(e));
    } finally {
      if (n === pedidoAtual.current) {
        setCarregando(false);
        setAAtualizar(false);
      }
    }
  }, []);

  useEffect(() => {
    if (!ativo) return;
    jaCarregou.current = false;
    executar('inicial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo, executar, ...deps]);

  useFocusEffect(
    useCallback(() => {
      if (aoFocar && ativo && jaCarregou.current) executar('silencioso');
    }, [aoFocar, ativo, executar])
  );

  return {
    dados,
    setDados,
    erro,
    carregando,
    aAtualizar,
    /** Para o RefreshControl */
    atualizar: () => executar('atualizar'),
    /** Recarrega sem indicadores */
    recarregar: () => executar('silencioso'),
  };
}
