import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { obterLinkTemporario, paraErroApi, SERVIDOR_URL } from '@/src/services/api';
import { toast } from '@/src/store/toast.store';

/**
 * Abre um ficheiro protegido da API (anexo ou documento de identidade).
 * Com Cloudinary abre o link assinado no navegador (serve para imagem e PDF).
 * Sem Cloudinary devolve o URL da API para mostrar como imagem com o token.
 */
export function useAbrirFicheiro() {
  const [aAbrir, setAAbrir] = useState(false);
  const [imagemLocal, setImagemLocal] = useState<string | null>(null);

  async function abrir(caminho: string, mensagem404 = 'Ficheiro não encontrado.') {
    setAAbrir(true);
    try {
      const link = await obterLinkTemporario(caminho);
      if (link) await WebBrowser.openBrowserAsync(link);
      else setImagemLocal(caminho.startsWith('http') ? caminho : `${SERVIDOR_URL}${caminho}`);
    } catch (e) {
      const err = paraErroApi(e);
      toast.erro(err.status === 404 ? mensagem404 : err.message);
    } finally {
      setAAbrir(false);
    }
  }

  return { abrir, aAbrir, imagemLocal, fecharImagem: () => setImagemLocal(null) };
}
