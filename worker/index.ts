// Service Worker for Push Notifications
// Compiled separately by @ducanh2912/next-pwa via customWorkerSrc

const sw = globalThis as unknown as ServiceWorkerGlobalScope;

interface PushData {
  title?: string;
  body?: string;
  type?: string;
  dedupeId?: string;
  url?: string;
  // Campos extras para destaques NAO_PALPITOU
  tipo?: string;
  destaqueId?: string;
  grupoId?: string;
}

const DB_NAME = 'bolao-push';
const DB_VERSION = 1;
const DISMISSED_STORE = 'dismissed';
const DISMISSED_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;

/** Instância visível atual por tag — evita gravar dispensa no close por substituição. */
const instanciaAtual = new Map<string, string>();

function marcarInstanciaExibida(tag: string): string {
  const instanciaId = crypto.randomUUID();
  instanciaAtual.set(tag, instanciaId);
  return instanciaId;
}

function abrirBancoDismissed(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(DISMISSED_STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(new Error('A abertura do banco de notificações foi bloqueada'));
  });
}

async function notificacaoFoiDispensada(id: string): Promise<boolean> {
  const db = await abrirBancoDismissed();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(DISMISSED_STORE, 'readonly');
    const request = transaction.objectStore(DISMISSED_STORE).get(id);
    let dispensada = false;

    request.onsuccess = () => {
      const registro = request.result as { expiresAt: number } | undefined;
      dispensada = registro !== undefined && registro.expiresAt > Date.now();
    };
    transaction.oncomplete = () => {
      db.close();
      resolve(dispensada);
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

async function registrarNotificacaoDispensada(id: string): Promise<void> {
  const db = await abrirBancoDismissed();

  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(DISMISSED_STORE, 'readwrite');
    const store = transaction.objectStore(DISMISSED_STORE);
    const agora = Date.now();

    store.put({ id, expiresAt: agora + DISMISSED_RETENTION_MS });
    const cursorRequest = store.openCursor();
    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result;
      if (!cursor) return;
      if ((cursor.value as { expiresAt: number }).expiresAt <= agora) {
        cursor.delete();
      }
      cursor.continue();
    };
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error);
    };
  });
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

  const tag = data.dedupeId
    ? `push-${data.dedupeId}`
    : ehDestaqueNaoPalpitou
      ? `destaque-${data.destaqueId}`
      : `${data.type ?? 'default'}-${Date.now()}`;

  event.waitUntil(
    (async () => {
      if (data.dedupeId) {
        try {
          if (await notificacaoFoiDispensada(tag)) return;
        } catch (error) {
          console.error(
            '[Push] Não foi possível consultar notificações dispensadas:',
            error,
          );
        }
      }

      const instanciaId = marcarInstanciaExibida(tag);
      const options: NotificationOptions = {
        body,
        icon: '/logo-bolao.png',
        badge: '/logo-bolao.png',
        tag,
        data: {
          url: ehDestaqueNaoPalpitou
            ? `/grupos/${data.grupoId}`
            : (data.url ?? '/'),
          destaqueId: data.destaqueId,
          grupoId: data.grupoId,
          tipo: data.tipo,
          dedupeId: data.dedupeId,
          instanciaId,
        },
        ...(ehDestaqueNaoPalpitou && {
          actions: [
            { action: 'mandar-f', title: '🪦 Mandar F' },
            { action: 'abrir', title: 'Ver Destaque' },
          ],
        }),
      };

      await sw.registration.showNotification(title, options);
    })(),
  );
});

sw.addEventListener('notificationclose', (event: NotificationEvent) => {
  const tag = event.notification.tag;
  if (!tag.startsWith('push-')) return;

  const dados = event.notification.data as { instanciaId?: string } | undefined;
  if (instanciaAtual.get(tag) !== dados?.instanciaId) return;

  event.waitUntil(
    registrarNotificacaoDispensada(tag).catch((error: unknown) => {
      console.error(
        '[Push] Não foi possível salvar a notificação dispensada:',
        error,
      );
    }),
  );
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
