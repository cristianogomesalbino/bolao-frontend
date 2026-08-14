// Service Worker for Push Notifications
// Compiled separately by @ducanh2912/next-pwa via customWorkerSrc

const sw = globalThis as unknown as ServiceWorkerGlobalScope;

interface PushData {
  title?: string;
  body?: string;
  type?: string;
  url?: string;
  // Campos extras para destaques NAO_PALPITOU
  tipo?: string;
  destaqueId?: string;
  grupoId?: string;
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
  let data: PushData;

  if (!event.data) {
    // Sem dados — ainda assim precisa mostrar notificação para evitar
    // que o browser exiba "Este site foi atualizado em segundo plano"
    data = { title: 'Bolão', body: 'Nova notificação' };
  } else {
    try {
      data = event.data.json() as PushData;
    } catch {
      // Payload inválido — mostra notificação genérica com texto bruto
      const text = event.data.text();
      data = { title: 'Bolão', body: text || 'Nova notificação' };
    }
  }

  const title = data.title ?? 'Bolão';
  const body = data.body ?? 'Nova notificação';

  const ehDestaqueNaoPalpitou =
    data.tipo === 'NAO_PALPITOU' && !!data.destaqueId;

  const options: NotificationOptions = {
    body,
    icon: '/logo-bolao.png',
    badge: '/logo-bolao.png',
    tag: ehDestaqueNaoPalpitou
      ? `destaque-${data.destaqueId}`
      : `${data.type ?? 'default'}-${Date.now()}`,
    data: {
      url: ehDestaqueNaoPalpitou
        ? `/grupos/${data.grupoId}`
        : data.url ?? '/',
      destaqueId: data.destaqueId,
      grupoId: data.grupoId,
      tipo: data.tipo,
    },
    ...(ehDestaqueNaoPalpitou && {
      actions: [
        { action: 'mandar-f', title: '🪦 Mandar F' },
        { action: 'abrir', title: 'Ver Destaque' },
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
    destaqueId?: string;
    grupoId?: string;
    tipo?: string;
  };

  // Notification Action: "Mandar F" — dispara fetch direto do SW
  if (
    event.action === 'mandar-f' &&
    notifData.destaqueId &&
    notifData.grupoId
  ) {
    event.waitUntil(
      fetch(
        `/api/grupos/${notifData.grupoId}/destaques/${notifData.destaqueId}/mandar-f`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        },
      ).catch(() => {
        // Fallback: abrir app no destaque se fetch falhar
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
        // Tenta encontrar uma janela existente e navegar para a URL
        for (const client of clientList) {
          if (client.url.startsWith(sw.location.origin) && 'focus' in client) {
            // Navega para a URL da notificação e depois foca
            return client
              .navigate(fullUrl)
              .then((c: WindowClient | null) => c?.focus());
          }
        }
        // Nenhuma janela aberta — abre nova
        return sw.clients.openWindow(fullUrl);
      }),
  );
});
