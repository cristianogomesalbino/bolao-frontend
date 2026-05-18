'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function IndicadorServidor() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    async function verificar() {
      try {
        const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
        const response = await fetch(`${url}/`, { method: 'GET', signal: AbortSignal.timeout(5000) });
        setOffline(!response.ok);
      } catch {
        setOffline(true);
      }
    }

    verificar();
    const interval = setInterval(verificar, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-erro/90 px-4 py-2 text-center" data-testid="indicador-servidor-offline">
      <WifiOff size={14} className="text-white" />
      <span className="text-xs font-medium text-white">Servidor indisponível</span>
    </div>
  );
}
