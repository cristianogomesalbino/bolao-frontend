'use client';

import { useEffect, useState } from 'react';

type StatusServidor = 'verificando' | 'online' | 'acordando' | 'offline';

const HEALTH_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/health`;
const TIMEOUT_RAPIDO = 3000;
const TIMEOUT_ACORDAR = 60000;

/**
 * Hook que verifica se o backend está online (warm-up).
 * - Se responder em <3s → online (cold start não aconteceu)
 * - Se demorar >3s → mostra "acordando" e espera até 60s
 * - Se não responder → offline
 */
export function useWarmUp() {
  const [status, setStatus] = useState<StatusServidor>('verificando');

  useEffect(() => {
    const controller = new AbortController();
    let timeoutRapido: NodeJS.Timeout;

    async function verificar() {
      timeoutRapido = setTimeout(() => {
        if (status === 'verificando') {
          setStatus('acordando');
        }
      }, TIMEOUT_RAPIDO);

      try {
        const response = await fetch(HEALTH_URL, {
          signal: controller.signal,
          cache: 'no-store',
        });

        clearTimeout(timeoutRapido);

        if (response.ok) {
          setStatus('online');
        } else {
          setStatus('offline');
        }
      } catch (error: unknown) {
        clearTimeout(timeoutRapido);
        if ((error as Error).name === 'AbortError') return;
        setStatus('offline');
      }
    }

    verificar();

    // Timeout máximo para dar up
    const timeoutMax = setTimeout(() => {
      if (status !== 'online') {
        controller.abort();
        setStatus('offline');
      }
    }, TIMEOUT_ACORDAR);

    return () => {
      controller.abort();
      clearTimeout(timeoutRapido);
      clearTimeout(timeoutMax);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { status, estaOnline: status === 'online' };
}
