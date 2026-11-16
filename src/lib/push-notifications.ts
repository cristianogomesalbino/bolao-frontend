import { inscreverPush, cancelarPush } from '@/services/notificacao.service';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const PUSH_PENDING_KEY = 'push-sync-pendente';
const SW_URL = '/sw.js';

export type ResultadoInscricaoPush =
  | { ok: true }
  | { ok: false; motivo: string };

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

/** Chrome exige ArrayBuffer “exato”; `.buffer` de Uint8Array pode incluir bytes extras. */
function chaveAplicacaoVapid(): BufferSource {
  const bytes = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  );
}

async function criarSubscription(
  registration: ServiceWorkerRegistration,
): Promise<PushSubscription> {
  const opcoes: PushSubscriptionOptionsInit = {
    userVisibleOnly: true,
    applicationServerKey: chaveAplicacaoVapid(),
  };

  try {
    return await registration.pushManager.subscribe(opcoes);
  } catch (primeiroErro) {
    // Subscription fantasma / GCM quebrado: limpa e tenta 1x de novo.
    const existente = await registration.pushManager.getSubscription();
    if (existente) {
      await existente.unsubscribe();
    }
    try {
      return await registration.pushManager.subscribe(opcoes);
    } catch {
      throw primeiroErro;
    }
  }
}

function mensagemErroSubscribe(detalhe: string): string {
  if (/push service error/i.test(detalhe)) {
    return (
      'Chrome/FCM recusou o registro (erro do navegador). ' +
      'Em DevTools → Application: apague Service Workers + Clear site data deste site, ' +
      'recarregue, ou use um perfil novo do Chrome / Firefox. ' +
      'Enquanto isso, use /notificacoes ou “Testar alerta local”.'
    );
  }
  return `Falha ao inscrever push: ${detalhe}`;
}

/**
 * Mostra uma notificação pelo SW sem FCM — útil quando pushManager.subscribe falha no Chrome.
 */
export async function testarNotificacaoLocal(): Promise<ResultadoInscricaoPush> {
  if (!pushSuportado()) {
    return { ok: false, motivo: 'Notificações não suportadas neste navegador.' };
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    return {
      ok: false,
      motivo: 'Permissão não concedida. Aceite o popup do navegador.',
    };
  }

  const registration = await registrarServiceWorkerPush();
  if (!registration) {
    return {
      ok: false,
      motivo: 'Service Worker indisponível. Recarregue em localhost:3003.',
    };
  }

  await registration.showNotification('Oi sumido (a)!', {
    body: 'Cristiano está sentindo sua falta nos palpites! 😂',
    icon: '/logo-bolao.png',
    badge: '/logo-bolao.png',
    tag: `teste-local-${Date.now()}`,
    data: { url: '/notificacoes' },
  });

  return { ok: true };
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
    const registration = await navigator.serviceWorker.register(SW_URL, {
      scope: '/',
    });
    await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => {
        globalThis.setTimeout(() => resolve(null), 8000);
      }),
    ]);
    return registration;
  } catch (error) {
    console.warn('[Push] Erro ao registrar SW:', error);
    return null;
  }
}

export async function inscreverNotificacoesPush(): Promise<ResultadoInscricaoPush> {
  if (!pushSuportado()) {
    return {
      ok: false,
      motivo: 'Este navegador não suporta notificações push.',
    };
  }
  if (!VAPID_PUBLIC_KEY) {
    return {
      ok: false,
      motivo: 'Chave VAPID ausente no frontend (.env).',
    };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'denied') {
      return {
        ok: false,
        motivo: 'Permissão bloqueada nas configurações do site.',
      };
    }
    if (permission !== 'granted') {
      return {
        ok: false,
        motivo:
          'Permissão não concedida. Clique em “Permitir” no popup do navegador.',
      };
    }

    const registration = await registrarServiceWorkerPush();
    if (!registration) {
      return {
        ok: false,
        motivo:
          'Service Worker não registrou. Recarregue em http://localhost:3003 e tente de novo.',
      };
    }

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      try {
        subscription = await criarSubscription(registration);
      } catch (subscribeError) {
        const detalhe =
          subscribeError instanceof Error
            ? subscribeError.message
            : 'falha desconhecida';
        console.warn('[Push] subscribe falhou:', subscribeError);
        return {
          ok: false,
          motivo: mensagemErroSubscribe(detalhe),
        };
      }
    }

    try {
      await inscreverPush(subscription);
      localStorage.removeItem(PUSH_PENDING_KEY);
    } catch {
      const json = subscription.toJSON();
      localStorage.setItem(PUSH_PENDING_KEY, JSON.stringify(json));
    }

    return { ok: true };
  } catch (error) {
    console.error('[Push] Erro ao inscrever:', error);
    return {
      ok: false,
      motivo:
        error instanceof Error
          ? error.message
          : 'Erro inesperado ao ativar push.',
    };
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

async function reinscreverSeNecessario(): Promise<void> {
  if (Notification.permission !== 'granted') return;

  try {
    const registration = await registrarServiceWorkerPush();
    if (!registration) return;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;

    await inscreverPush(subscription);
  } catch {
    // Falha silenciosa — não bloqueia nada
  }
}

export async function cancelarNotificacoesPush(): Promise<boolean> {
  if (!pushSuportado()) return false;

  try {
    const registration = await registrarServiceWorkerPush();
    if (!registration) return false;
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
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => {
        globalThis.setTimeout(() => resolve(null), 3000);
      }),
    ]);
    if (!registration) return false;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}
