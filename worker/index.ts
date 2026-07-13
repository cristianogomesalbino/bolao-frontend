// Service Worker for Push Notifications
// Compiled separately by @ducanh2912/next-pwa via customWorkerSrc

const sw = globalThis as unknown as ServiceWorkerGlobalScope;

interface PushData {
  title?: string;
  body?: string;
  type?: string;
  url?: string;
}

// Ativa o SW novo imediatamente (sem esperar fechar o app)
sw.addEventListener('install', () => {
  sw.skipWaiting();
});

// Assume controle dos clients existentes e notifica que o SW atualizou
sw.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    sw.clients.claim().then(() =>
      sw.clients
        .matchAll({ type: 'window' })
        .then((clients) =>
          clients.forEach((client) =>
            client.postMessage({ type: 'SW_UPDATED' }),
          ),
        ),
    ),
  );
});

// Push notification handler
sw.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  let data: PushData;
  try {
    data = event.data.json() as PushData;
  } catch {
    // Payload inválido — mostra notificação genérica com texto bruto
    const text = event.data.text();
    data = { title: 'Bolão', body: text || 'Nova notificação' };
  }

  const title = data.title ?? 'Bolão';
  const options: NotificationOptions = {
    body: data.body ?? '',
    icon: '/logo-bolao.png',
    badge: '/logo-bolao.png',
    tag: `${data.type ?? 'default'}-${Date.now()}`,
    data: { url: data.url ?? '/' },
  };

  event.waitUntil(sw.registration.showNotification(title, options));
});

// Click handler — opens the app at the relevant URL (cross-browser safe)
sw.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const url = (event.notification.data as { url?: string })?.url ?? '/';
  const fullUrl = new URL(url, sw.location.origin).href;

  event.waitUntil(
    sw.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList: readonly WindowClient[]) => {
        for (const client of clientList) {
          if (client.url.startsWith(sw.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        return sw.clients.openWindow(fullUrl);
      }),
  );
});
