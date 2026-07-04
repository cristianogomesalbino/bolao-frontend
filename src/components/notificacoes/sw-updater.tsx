'use client';

import { useEffect } from 'react';
import { inscreverNotificacoesPush, pushSuportado } from '@/lib/push-notifications';

/**
 * Componente invisível que escuta mensagens do Service Worker.
 * Quando o SW é atualizado (deploy novo), re-inscreve automaticamente
 * o push notification com o novo endpoint — sem ação do usuário.
 */
export function SwUpdater() {
  useEffect(() => {
    if (!pushSuportado()) return;
    if (Notification.permission !== 'granted') return;

    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'SW_UPDATED') {
        // SW novo ativou — renovar subscription silenciosamente
        inscreverNotificacoesPush().catch(() => {
          // Falha silenciosa — não bloqueia nada
        });
      }
    };

    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, []);

  return null;
}
