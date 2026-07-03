import { inscreverPush, cancelarPush } from '@/services/notificacao.service';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

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
    // Usa o SW já registrado pelo next-pwa (que inclui o custom worker com push handlers)
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

    // Verificar se já existe inscrição
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
        });
      } catch (subscribeError) {
        // Push subscribe falha em localhost (HTTP) — esperado em desenvolvimento
        console.warn('[Push] Não foi possível inscrever (requer HTTPS):', subscribeError);
        return false;
      }
    }

    // Enviar inscrição para o backend
    await inscreverPush(subscription);
    return true;
  } catch (error) {
    console.error('[Push] Erro ao inscrever:', error);
    return false;
  }
}

export async function cancelarNotificacoesPush(): Promise<boolean> {
  if (!pushSuportado()) return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    if (!registration) return false;

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return false;

    await cancelarPush(subscription.endpoint);
    await subscription.unsubscribe();
    return true;
  } catch (error) {
    console.error('[Push] Erro ao cancelar:', error);
    return false;
  }
}

export async function verificarInscricaoPushAtiva(): Promise<boolean> {
  if (!pushSuportado()) return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    if (!registration) return false;

    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}
