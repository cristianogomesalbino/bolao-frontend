import { inscreverPush, cancelarPush } from '@/services/notificacao.service';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const PUSH_PENDING_KEY = 'push-sync-pendente';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replaceAll('-', '+').replaceAll('_', '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.codePointAt(i) ?? 0;
  }
  return outputArray;
}

export function pushSuportado(): boolean {
  return (
    globalThis.window !== undefined &&
    'serviceWorker' in navigator &&
    'PushManager' in globalThis &&
    'Notification' in globalThis
  );
}

export async function obterPermissaoPush(): Promise<NotificationPermission> {
  if (!pushSuportado()) return 'denied';
  return Notification.permission;
}

export async function registrarServiceWorkerPush(): Promise<ServiceWorkerRegistration | null> {
  if (!pushSuportado()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    return registration;
  } catch (error) {
    console.warn('[Push] Erro ao obter SW:', error);
    return null;
  }
}

export async function inscreverNotificacoesPush(): Promise<boolean> {
  if (!pushSuportado()) return false;
  if (!VAPID_PUBLIC_KEY) {
    console.warn('[Push] VAPID_PUBLIC_KEY não configurada');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const registration = await registrarServiceWorkerPush();
    if (!registration) return false;

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
        });
      } catch (subscribeError) {
        console.warn('[Push] Não foi possível inscrever (requer HTTPS):', subscribeError);
        return false;
      }
    }

    // Tentar enviar pro backend. Se falhar (401, offline), salvar como pendente
    try {
      await inscreverPush(subscription);
      localStorage.removeItem(PUSH_PENDING_KEY);
    } catch {
      // Salva subscription pra sincronizar quando logar
      const json = subscription.toJSON();
      localStorage.setItem(PUSH_PENDING_KEY, JSON.stringify(json));
    }

    return true;
  } catch (error) {
    console.error('[Push] Erro ao inscrever:', error);
    return false;
  }
}

/**
 * Sincroniza subscription push pendente com o backend.
 * Chamar após login bem-sucedido.
 */
export async function sincronizarPushPendente(): Promise<void> {
  if (!pushSuportado()) return;

  const pendente = localStorage.getItem(PUSH_PENDING_KEY);
  if (!pendente) {
    // Mesmo sem pendente, verificar se existe subscription ativa que precisa ser re-enviada
    await reinscreverSeNecessario();
    return;
  }

  try {
    const json = JSON.parse(pendente) as PushSubscriptionJSON;
    if (!json.endpoint || !json.keys) return;

    await inscreverPush({
      toJSON: () => json,
      endpoint: json.endpoint,
    } as unknown as PushSubscription);

    localStorage.removeItem(PUSH_PENDING_KEY);
  } catch {
    // Falhou de novo — será tentado no próximo login
  }
}

/**
 * Verifica se existe subscription push ativa no browser mas que pode
 * não estar no backend (ex: SW atualizou). Se sim, re-envia.
 */
async function reinscreverSeNecessario(): Promise<void> {
  if (Notification.permission !== 'granted') return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    // Silenciosamente re-inscreve no backend (idempotente — atualiza keys se endpoint já existe)
    await inscreverPush(subscription);
  } catch {
    // Falha silenciosa — não bloqueia nada
  }
}

export async function cancelarNotificacoesPush(): Promise<boolean> {
  if (!pushSuportado()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return false;

    await cancelarPush(subscription.endpoint);
    await subscription.unsubscribe();
    localStorage.removeItem(PUSH_PENDING_KEY);
    return true;
  } catch (error) {
    console.error('[Push] Erro ao cancelar:', error);
    return false;
  }
}

export async function verificarInscricaoPushAtiva(): Promise<boolean> {
  if (!pushSuportado()) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}
