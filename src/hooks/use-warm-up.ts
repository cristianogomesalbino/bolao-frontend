'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

type StatusServidor = 'verificando' | 'online' | 'acordando' | 'offline';

const HEALTH_URL = `${(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '')}/health`;
const TIMEOUT_RAPIDO_MS = 3000;
const INTERVALO_RETRY_MS = 5000;
const MAX_TENTATIVAS = 12;

/**
 * Faz fetch no /health com timeout de 10s.
 * Usa fetch nativo (não apiClient) pois roda antes do auth estar configurado.
 */
async function verificarHealth(signal: AbortSignal): Promise<boolean> {
  try {
    const response = await fetch(HEALTH_URL, { signal, cache: 'no-store' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Hook que verifica se o backend está online (warm-up).
 * - Resposta em <3s → online
 * - Demora >3s → "acordando" com retry a cada 5s
 * - Sem resposta após 60s → offline
 */
export function useWarmUp() {
  const [status, setStatus] = useState<StatusServidor>('verificando');
  const tentativasRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const limparInterval = useCallback(() => {
    if (!intervalRef.current) return;
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }, []);

  useEffect(() => {
    let ativo = true;

    async function ping() {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const online = await verificarHealth(controller.signal);
      clearTimeout(timeout);

      if (!ativo) return;

      if (online) {
        setStatus('online');
        limparInterval();
        return;
      }

      tentativasRef.current++;
      if (tentativasRef.current < MAX_TENTATIVAS) return;

      setStatus('offline');
      limparInterval();
    }

    ping();

    const timeoutInicial = setTimeout(() => {
      if (!ativo) return;

      setStatus((prev) => {
        if (prev !== 'verificando') return prev;
        intervalRef.current = setInterval(ping, INTERVALO_RETRY_MS);
        return 'acordando';
      });
    }, TIMEOUT_RAPIDO_MS);

    return () => {
      ativo = false;
      clearTimeout(timeoutInicial);
      limparInterval();
    };
  }, [limparInterval]);

  return { status, estaOnline: status === 'online' };
}
