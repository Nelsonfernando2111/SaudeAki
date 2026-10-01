import { AppState, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import type * as NotificationsModulo from 'expo-notifications';
import type * as TaskManagerModulo from 'expo-task-manager';

import { registarTokenFcm } from './paciente.service';

/* =====================================================================
 * Push FCM do pedido de acesso (secção 11 da API).
 *
 * O backend envia uma *data message* (sem título), que o Android não mostra
 * sozinho com a app em segundo plano. Por isso uma tarefa de fundo recebe a
 * mensagem e cria uma notificação local "Pedido de acesso". Tocar nela abre
 * o ecrã Aprovar/Negar.
 *
 * Só funciona numa development/production build Android com
 * google-services.json (não funciona no Expo Go nem em emuladores sem Google Play).
 *
 * No Expo Go (Android) importar `expo-notifications` dá erro logo ao carregar,
 * por isso o módulo só é carregado (require) quando o push está disponível.
 * ===================================================================== */

export const CANAL_PEDIDOS = 'pedidos-acesso';
const TAREFA_PUSH = 'SAUDEID_PUSH_PEDIDO_ACESSO';

/** Dados que o backend envia no push */
export interface DadosPushPedido {
  tipo: 'PEDIDO_ACESSO';
  pedidoId: string;
  medicoNome: string;
  unidadeSanitariaNome: string;
}

export const pushDisponivel =
  Platform.OS === 'android' &&
  Device.isDevice &&
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

/* eslint-disable @typescript-eslint/no-require-imports */
const Notifications: typeof NotificationsModulo | null = pushDisponivel
  ? require('expo-notifications')
  : null;
const TaskManager: typeof TaskManagerModulo | null = pushDisponivel
  ? require('expo-task-manager')
  : null;
/* eslint-enable @typescript-eslint/no-require-imports */

/** Toques em notificações mais antigas que isto já não abrem o pedido */
const VALIDADE_TOQUE_MS = 2 * 60 * 1000;

/** Extrai os dados do pedido de uma notificação (remota ou local) */
export function dadosDoPedido(dados: unknown): DadosPushPedido | null {
  const d = dados as Partial<DadosPushPedido> | null | undefined;
  if (d?.tipo !== 'PEDIDO_ACESSO' || !d.pedidoId) return null;
  return {
    tipo: 'PEDIDO_ACESSO',
    pedidoId: String(d.pedidoId),
    medicoNome: d.medicoNome ?? 'Um médico',
    // O backend envia a string "null" quando não há unidade
    unidadeSanitariaNome: d.unidadeSanitariaNome && d.unidadeSanitariaNome !== 'null' ? d.unidadeSanitariaNome : '',
  };
}

/** Dados do pedido numa notificação: local (content.data) ou push FCM (remoteMessage.data) */
function dadosDaNotificacao(n: NotificationsModulo.Notification): DadosPushPedido | null {
  const trigger = n.request.trigger as NotificationsModulo.PushNotificationTrigger | null;
  return (
    dadosDoPedido(n.request.content.data) ??
    (trigger?.type === 'push' ? dadosDoPedido(trigger.remoteMessage?.data) : null)
  );
}

async function mostrarNotificacaoLocal(p: DadosPushPedido) {
  if (!Notifications) return;
  const unidade = p.unidadeSanitariaNome ? ` (${p.unidadeSanitariaNome})` : '';
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Pedido de acesso ao seu histórico',
      body: `${p.medicoNome}${unidade} pede acesso completo. Responda em 60 segundos.`,
      data: { ...p },
      priority: Notifications.AndroidNotificationPriority.MAX,
    },
    trigger: { channelId: CANAL_PEDIDOS },
  });
}

/* ---------- Tarefa de fundo (tem de ser definida no âmbito do módulo) ---------- */

if (Notifications && TaskManager) {
  const N = Notifications;
  TaskManager.defineTask<NotificationsModulo.NotificationTaskPayload>(TAREFA_PUSH, async ({ data }) => {
    // Respostas a toques são tratadas pelos listeners da app
    if (!data || 'actionIdentifier' in data) return N.BackgroundNotificationTaskResult.NoData;
    // Com a app aberta, o layout do paciente já abre o ecrã diretamente
    if (AppState.currentState === 'active') return N.BackgroundNotificationTaskResult.NoData;

    const pedido = dadosDoPedido(data.data);
    if (!pedido) return N.BackgroundNotificationTaskResult.NoData;
    await mostrarNotificacaoLocal(pedido);
    return N.BackgroundNotificationTaskResult.NewData;
  });

  N.registerTaskAsync(TAREFA_PUSH).catch(() => {});

  // Mensagens só de dados não têm título: não mostrar banner vazio. As locais mostram-se.
  N.setNotificationHandler({
    handleNotification: async (n) => {
      const temTexto = !!(n.request.content.title || n.request.content.body);
      return {
        shouldShowBanner: temTexto,
        shouldShowList: temTexto,
        shouldPlaySound: temTexto,
        shouldSetBadge: false,
      };
    },
  });
}

/* ---------- Registo do token ---------- */

async function prepararCanal(N: typeof NotificationsModulo) {
  await N.setNotificationChannelAsync(CANAL_PEDIDOS, {
    name: 'Pedidos de acesso',
    description: 'Quando um médico pede acesso ao seu histórico clínico',
    importance: N.AndroidImportance.MAX,
    vibrationPattern: [0, 300, 200, 300],
    lightColor: '#2563EB',
  });
}

/**
 * Pede permissão, obtém o token FCM do dispositivo e envia-o para
 * PUT /pacientes/me/fcm-token. Chamar depois do login do paciente.
 * Devolve uma função para parar de ouvir renovações do token.
 */
export async function ativarPushPaciente(): Promise<() => void> {
  const N = Notifications;
  if (!N) return () => {};

  await prepararCanal(N);

  const atual = await N.getPermissionsAsync();
  const permissao = atual.granted ? atual : await N.requestPermissionsAsync();
  if (!permissao.granted) return () => {};

  const token = await N.getDevicePushTokenAsync();
  await registarTokenFcm(String(token.data));

  // O FCM pode renovar o token: volta a registar
  const sub = N.addPushTokenListener((novo) => {
    registarTokenFcm(String(novo.data)).catch(() => {});
  });
  return () => sub.remove();
}

/**
 * Chama `aoPedido` quando chega um push de pedido com a app aberta, quando o
 * paciente toca na notificação, e para o toque que abriu a app (se recente).
 * Devolve a função para parar de ouvir. Sem push disponível, não faz nada.
 */
export function ouvirPedidosPush(aoPedido: (p: DadosPushPedido) => void): () => void {
  const N = Notifications;
  if (!N) return () => {};

  const tratar = (n: NotificationsModulo.Notification) => {
    const p = dadosDaNotificacao(n);
    if (p) aoPedido(p);
  };

  const recebidas = N.addNotificationReceivedListener(tratar);
  const toques = N.addNotificationResponseReceivedListener((r) => tratar(r.notification));

  // Toque que abriu a app quando estava fechada
  N.getLastNotificationResponseAsync()
    .then((r) => {
      if (r && Date.now() - r.notification.date <= VALIDADE_TOQUE_MS) tratar(r.notification);
    })
    .catch(() => {});

  return () => {
    recebidas.remove();
    toques.remove();
  };
}
