'use client';

import { useEffect } from 'react';
import {
  inscreverNotificacoesPush,
  pushSuportado,
} from '@/lib/push-notifications';

const STORAGE_KEY = 'push-banner-dispensado';

/**
 * Limpa o cooldown de quem dispensou o banner e tenta inscrever o push
 * sem modal. Se o navegador ignorar o pedido no carregamento, repete
 * no primeiro toque ou tecla, uma vez por montagem.
 */
export function AtivadorPush() {
  useEffect(() => {
    if (!pushSuportado()) return;

    localStorage.removeItem(STORAGE_KEY);

    if (Notification.permission === 'denied') return;

    let ativo = true;
    let gestoUsado = false;

    const removerGesto = () => {
      globalThis.removeEventListener('pointerdown', aoGesto, true);
      globalThis.removeEventListener('keydown', aoGesto, true);
    };

    const aoGesto = () => {
      if (gestoUsado || Notification.permission !== 'default') {
        removerGesto();
        return;
      }
      gestoUsado = true;
      removerGesto();
      inscreverNotificacoesPush().catch(() => {});
    };

    const registrarGesto = () => {
      if (!ativo || Notification.permission !== 'default') return;
      globalThis.addEventListener('pointerdown', aoGesto, true);
      globalThis.addEventListener('keydown', aoGesto, true);
    };

    inscreverNotificacoesPush()
      .catch(() => {})
      .finally(registrarGesto);

    return () => {
      ativo = false;
      removerGesto();
    };
  }, []);

  return null;
}
