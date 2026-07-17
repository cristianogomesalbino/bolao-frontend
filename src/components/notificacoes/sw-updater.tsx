'use client';

import { useEffect } from 'react';
import { inscreverNotificacoesPush, pushSuportado } from '@/lib/push-notifications';

const UPDATE_INTERVAL_MS = 60 * 60 * 1000; // 1 hora

/**
 * Componente invisível que:
 * 1. Força verificação de atualização do SW ao abrir o app
 * 2. Verifica periodicamente (1h) se há nova versão do SW
 * 3. Escuta mensagem SW_UPDATED e re-inscreve push silenciosamente
 *
 * Garante que usuários PWA recebam o SW mais recente sem reinstalar.
 */
export function SwUpdater() {
  // Força update check do SW ao montar e periodicamente
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const forcarUpdate = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
      } catch {
        // Falha silenciosa — rede offline ou SW não registrado
      }
    };

    // Update imediato ao abrir o app
    forcarUpdate();

    // Update periódico (1h)
    const interval = setInterval(forcarUpdate, UPDATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  // Escuta mensagem do SW quando ele atualiza
  useEffect(() => {
    if (!pushSuportado()) return;
    if (Notification.permission !== 'granted') return;

    const handler = (event: MessageEvent) => {
      if (event.data?.type !== 'SW_UPDATED') return;

      inscreverNotificacoesPush().catch(() => {
        // Falha silenciosa — não bloqueia nada
      });
    };

    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, []);

  return null;
}
