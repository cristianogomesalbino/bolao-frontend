'use client';

import { useEffect, useState } from 'react';

export function IndicadorOffline() {
  const [estaOffline, setEstaOffline] = useState(false);

  useEffect(() => {
    function aoFicarOffline() {
      setEstaOffline(true);
    }

    function aoFicarOnline() {
      setEstaOffline(false);
    }

    globalThis.addEventListener('offline', aoFicarOffline);
    globalThis.addEventListener('online', aoFicarOnline);

    // Check initial state
    setEstaOffline(!navigator.onLine);

    return () => {
      globalThis.removeEventListener('offline', aoFicarOffline);
      globalThis.removeEventListener('online', aoFicarOnline);
    };
  }, []);

  if (!estaOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-destaque px-4 py-2 text-center text-sm font-medium text-fundo">
      Você está offline. Algumas funcionalidades podem não estar disponíveis.
    </div>
  );
}
