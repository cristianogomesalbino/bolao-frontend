// Service Worker for Push Notifications
// Compiled separately by @ducanh2912/next-pwa via customWorkerSrc

const sw = globalThis as unknown as ServiceWorkerGlobalScope;

interface PushData {
  title?: string;
  body?: string;
  type?: string;
  url?: string;
  // Campos extras para stories NAO_PALPITOU
  tipo?: string;
  storyId?: string;
  grupoId?: string;
}

// Push notification handler
sw.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  const data = event.data.json() as PushData;
  const title = data.title ?? 'Bolão';

  // Story NAO_PALPITOU — incluir Notification Actions (progressive enhancement)
  const ehStoryNaoPalpitou = data.tipo === 'NAO_PALPITOU' && data.storyId && data.grupoId;

  const options: NotificationOptions = {
    body: data.body ?? '',
    icon: '/logo-bolao.png',
    badge: '/logo-bolao.png',
    tag: ehStoryNaoPalpitou
      ? `story-${data.storyId}`
      : `${data.type ?? 'default'}-${Date.now()}`,
    data: {
      url: ehStoryNaoPalpitou
        ? `/grupos/${data.grupoId}`
        : data.url ?? '/',
      storyId: data.storyId,
      grupoId: data.grupoId,
      tipo: data.tipo,
    },
    ...(ehStoryNaoPalpitou && {
      actions: [
        { action: 'mandar-f', title: '🪦 Mandar F' },
        { action: 'abrir', title: 'Ver Story' },
      ],
    }),
  };

  event.waitUntil(sw.registration.showNotification(title, options));
});

// Click handler — opens the app at the relevant URL (cross-browser safe)
sw.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const notifData = event.notification.data as {
    url?: string;
    storyId?: string;
    grupoId?: string;
    tipo?: string;
  };

  // Notification Action: "Mandar F" — dispara fetch direto do SW
  if (event.action === 'mandar-f' && notifData.storyId && notifData.grupoId) {
    event.waitUntil(
      fetch(`/api/grupos/${notifData.grupoId}/stories/${notifData.storyId}/mandar-f`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      }).catch(() => {
        // Fallback: abrir app no story se fetch falhar
        return sw.clients.openWindow(notifData.url ?? '/');
      }),
    );
    return;
  }

  // Ação padrão: abrir/focar janela
  const url = notifData.url ?? '/';
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
