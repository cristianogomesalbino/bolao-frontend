'use client';

import { useEffect, useRef, useState } from 'react';

type StatusServidor = 'verificando' | 'online' | 'acordando' | 'offline';

const HEALTH_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/health`;
const TIMEOUT_RAPIDO = 3000;
const INTERVALO_RETRY = 5000;
const MAX_TENTATIVAS = 12; // 12 * 5s = 60s máximo

function pararIntervalo(ref: React.RefObject<NodeJS.Timeout | null>) {
  if (!ref.current) return;
  clearInterval(ref.current);
  ref.current = null;
}

/**
 * Hook que verifica se o backend está online (warm-up).
 * - Se responder em <3s → online
 * - Se demorar >3s → mostra "acordando" e fica tentando a cada 5s
 * - Se não responder após 60s → offline
 */
export function useWarmUp() {
  const [status, setStatus] = useState<StatusServidor>('verificando');
  const tentativasRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let cancelado = false;

    async function ping() {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(HEALTH_URL, {
          signal: controller.signal,
          cache: 'no-store',
        });
        clearTimeout(timeout);

        if (cancelado || !response.ok) return;

        setStatus('online');
        pararIntervalo(intervalRef);
      } catch {
        if (cancelado) return;

        tentativasRef.current++;
        if (tentativasRef.current < MAX_TENTATIVAS) return;

        setStatus('offline');
        pararIntervalo(intervalRef);
      }
    }

    ping();

    const timeoutRapido = setTimeout(() => {
      if (cancelado) return;
      setStatus((prev) => (prev === 'verificando' ? 'acordando' : prev));
      intervalRef.current = setInterval(ping, INTERVALO_RETRY);
    }, TIMEOUT_RAPIDO);

    return () => {
      cancelado = true;
      clearTimeout(timeoutRapido);
      pararIntervalo(intervalRef);
    };
  }, []);

  return { status, estaOnline: status === 'online' };
}
