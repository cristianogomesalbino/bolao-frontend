'use client';

import { useEffect, useState } from 'react';

export function IndicadorServidor() {
  const [servidorIndisponivel, setServidorIndisponivel] = useState(false);

  useEffect(() => {
    const intervalId: ReturnType<typeof setInterval> = setInterval(verificarServidor, 30000);

    async function verificarServidor() {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002';
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        
        await fetch(baseUrl, { 
          method: 'HEAD', 
          signal: controller.signal,
          mode: 'no-cors',
        });
        
        clearTimeout(timeout);
        setServidorIndisponivel(false);
      } catch {
        setServidorIndisponivel(true);
      }
    }

    verificarServidor();

    return () => clearInterval(intervalId);
  }, []);

  if (!servidorIndisponivel) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-destaque/90 px-4 py-2 text-center"
      data-testid="indicador-servidor-offline"
    >
      <span className="text-xs font-medium text-fundo">⚠️ Servidor indisponível</span>
    </div>
  );
}
