import { SERVIDOR_URL } from './api';

/* =====================================================================
 * Notificações em tempo real (secção 11): STOMP sobre o endpoint /ws.
 * O endpoint é SockJS; o Spring aceita WebSocket "puro" em /ws/websocket,
 * por isso basta um cliente STOMP mínimo, sem dependências extra.
 * Uma única ligação partilhada por todas as subscrições; religa sozinha.
 * Os ecrãs devem ter sempre um fallback por polling (ex.: /estado).
 * ===================================================================== */

type Ouvinte = (corpo: unknown) => void;

const WS_URL = `${SERVIDOR_URL.replace(/^http/, 'ws')}/ws/websocket`;
const NULO = '\u0000';

const subscricoes = new Map<string, { destino: string; ouvinte: Ouvinte }>();
let socket: WebSocket | null = null;
let ligado = false;
let buffer = '';
let proximoId = 0;
let tentativas = 0;
let temporizadorReligar: ReturnType<typeof setTimeout> | null = null;

function enviarFrame(comando: string, cabecalhos: Record<string, string>, corpo = '') {
  if (!socket || socket.readyState !== WebSocket.OPEN) return;
  const linhas = Object.entries(cabecalhos).map(([k, v]) => `${k}:${v}`);
  socket.send(`${comando}\n${linhas.join('\n')}\n\n${corpo}${NULO}`);
}

function subscreverNoServidor(id: string, destino: string) {
  enviarFrame('SUBSCRIBE', { id, destination: destino, ack: 'auto' });
}

function tratarFrame(bruto: string) {
  const frame = bruto.replace(/^\n+/, ''); // heart-beats são "\n"
  if (!frame) return;

  const fimCabecalho = frame.indexOf('\n\n');
  const topo = fimCabecalho >= 0 ? frame.slice(0, fimCabecalho) : frame;
  const corpo = fimCabecalho >= 0 ? frame.slice(fimCabecalho + 2) : '';
  const [comando, ...linhas] = topo.split('\n');

  if (comando === 'CONNECTED') {
    ligado = true;
    tentativas = 0;
    subscricoes.forEach((s, id) => subscreverNoServidor(id, s.destino));
    return;
  }

  if (comando === 'MESSAGE') {
    const cabecalhos = Object.fromEntries(
      linhas.map((l) => {
        const i = l.indexOf(':');
        return [l.slice(0, i), l.slice(i + 1)];
      })
    );
    const sub = subscricoes.get(cabecalhos.subscription);
    if (!sub) return;
    try {
      sub.ouvinte(JSON.parse(corpo));
    } catch {
      sub.ouvinte(corpo);
    }
  }
}

function ligar() {
  if (socket || subscricoes.size === 0) return;

  const ws = new WebSocket(WS_URL);
  socket = ws;

  ws.onopen = () => {
    const host = SERVIDOR_URL.replace(/^https?:\/\//, '').split('/')[0];
    enviarFrame('CONNECT', { 'accept-version': '1.2,1.1', host, 'heart-beat': '0,0' });
  };

  ws.onmessage = (evento) => {
    buffer += typeof evento.data === 'string' ? evento.data : '';
    let fim = buffer.indexOf(NULO);
    while (fim >= 0) {
      tratarFrame(buffer.slice(0, fim));
      buffer = buffer.slice(fim + 1);
      fim = buffer.indexOf(NULO);
    }
  };

  ws.onerror = () => {
    // onclose trata da religação
  };

  ws.onclose = () => {
    socket = null;
    ligado = false;
    buffer = '';
    agendarReligacao();
  };
}

function agendarReligacao() {
  if (temporizadorReligar || subscricoes.size === 0) return;
  const espera = Math.min(30000, 1000 * 2 ** tentativas);
  tentativas += 1;
  temporizadorReligar = setTimeout(() => {
    temporizadorReligar = null;
    ligar();
  }, espera);
}

function desligarSeVazio() {
  if (subscricoes.size > 0) return;
  if (temporizadorReligar) {
    clearTimeout(temporizadorReligar);
    temporizadorReligar = null;
  }
  if (socket) {
    enviarFrame('DISCONNECT', {});
    socket.onclose = null;
    socket.close();
    socket = null;
    ligado = false;
  }
}

/** Subscreve um tópico, ex.: `/topic/medico/{medicoId}/pedidos`. Devolve a função para cancelar. */
export function subscrever<T = unknown>(destino: string, ouvinte: (mensagem: T) => void) {
  const id = `sub-${proximoId++}`;
  subscricoes.set(id, { destino, ouvinte: ouvinte as Ouvinte });

  if (ligado) subscreverNoServidor(id, destino);
  else ligar();

  return () => {
    if (ligado) enviarFrame('UNSUBSCRIBE', { id });
    subscricoes.delete(id);
    desligarSeVazio();
  };
}

export const topicos = {
  pedidosDoMedico: (medicoId: string) => `/topic/medico/${medicoId}/pedidos`,
  sessoesDoMedico: (medicoId: string) => `/topic/medico/${medicoId}/sessoes`,
  pedidosDoPaciente: (codUnico: string) => `/topic/paciente/${codUnico}/pedidos`,
};
