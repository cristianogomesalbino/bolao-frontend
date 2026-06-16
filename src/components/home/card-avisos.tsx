'use client';

import { useState, useEffect } from 'react';
import { X, Megaphone } from 'lucide-react';
import { Aviso, obterAvisosNaoLidos, marcarAvisoComoLido } from '@/lib/avisos';

/**
 * Card de avisos do admin na home.
 * Mostra avisos não lidos e permite dispensá-los individualmente.
 */
export function CardAvisos() {
  const [avisos, setAvisos] = useState<Aviso[]>([]);

  useEffect(() => {
    setAvisos(obterAvisosNaoLidos());
  }, []);

  function dispensar(avisoId: string) {
    marcarAvisoComoLido(avisoId);
    setAvisos((prev) => prev.filter((a) => a.id !== avisoId));
  }

  if (avisos.length === 0) return null;

  return (
    <div className="space-y-2">
      {avisos.map((aviso) => (
        <div
          key={aviso.id}
          className="relative rounded-xl border border-[#ffdf00]/40 bg-[#ffdf00]/[0.06] p-3.5 overflow-hidden"
          data-testid={`aviso-${aviso.id}`}
        >
          <div className="flex items-start gap-2.5">
            <Megaphone size={16} className="text-[#ffdf00] shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-bold text-[#ffdf00] mb-0.5">{aviso.titulo}</p>
              <p className="text-[11px] text-texto/70 leading-relaxed whitespace-pre-line">{aviso.mensagem}</p>
            </div>
            <button
              type="button"
              onClick={() => dispensar(aviso.id)}
              className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/[0.08] transition-colors"
              aria-label="Dispensar aviso"
            >
              <X size={14} className="text-texto/40" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
