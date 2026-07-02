// Service Worker para Web Push Notifications

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const payload = event.data.json();

    const options = {
      body: payload.body || payload.mensagem || '',
      icon: '/logo-bolao.png',
      badge: '/logo-bolao.png',
      tag: payload.type || payload.tipo || 'bolao-notificacao',
      renotify: true,
      requireInteraction: true,
      data: {
        url: payload.url || '/notificacoes',
      },
      vibrate: [100, 50, 100],
    };

    event.waitUntil(
      self.registration.showNotification(payload.title || payload.titulo || 'Bolão', options),
    );
  } catch (error) {
    console.error('[SW Push] Erro ao processar push:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlPath = event.notification.data?.url || '/notificacoes';
  const fullUrl = self.location.origin + urlPath;

  // Sempre abre/foca — openWindow funciona em todos os cenários
  event.waitUntil(self.clients.openWindow(fullUrl));
});
