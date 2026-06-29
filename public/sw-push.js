// Service Worker para Web Push Notifications
// Este arquivo é registrado manualmente (separado do SW do next-pwa)

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();

    const options = {
      body: payload.body || '',
      icon: '/logo-bolao.png',
      badge: '/logo-bolao.png',
      tag: payload.type || 'bolao-notificacao',
      renotify: true,
      data: {
        url: payload.url || '/',
        type: payload.type,
      },
      vibrate: [100, 50, 100],
    };

    event.waitUntil(
      self.registration.showNotification(payload.title || 'Bolão', options),
    );
  } catch (error) {
    console.error('[SW Push] Erro ao processar push:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/notificacoes';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se já tem uma aba aberta, foca nela
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Senão, abre nova aba
      return self.clients.openWindow(url);
    }),
  );
});
