// Service Worker custom — push notifications
// Compilado pelo @ducanh2912/next-pwa e injetado no SW principal

export default null;
declare let self: ServiceWorkerGlobalScope;

// Força o novo SW a ativar imediatamente (sem esperar tabs fecharem)
self.addEventListener('install', () => {
  void self.skipWaiting();
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    self.clients.claim().then(() => {
      // Notifica todas as páginas que o SW atualizou — elas devem renovar a push subscription
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: 'SW_UPDATED' });
        }
      });
    }),
  );
});

// Handler de Web Push
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();

    const options: NotificationOptions & { renotify?: boolean; vibrate?: number[] } = {
      body: payload.body || payload.mensagem || '',
      icon: '/logo-bolao.png',
      badge: '/logo-bolao.png',
      tag: `${payload.type || payload.tipo || 'bolao'}-${payload.id || Date.now()}`,
      renotify: true,
      requireInteraction: true,
      data: {
        url: payload.url || '/notificacoes',
      },
      vibrate: [100, 50, 100],
    };

    event.waitUntil(
      self.registration.showNotification(
        payload.title || payload.titulo || 'Bolão',
        options,
      ),
    );
  } catch (error) {
    console.error('[SW Push] Erro ao processar push:', error);
  }
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const urlPath = event.notification.data?.url || '/notificacoes';
  const fullUrl = self.location.origin + urlPath;

  event.waitUntil(self.clients.openWindow(fullUrl));
});
