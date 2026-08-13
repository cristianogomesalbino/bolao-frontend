'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { useDicasStore } from '@/stores/dicas.store';

interface PropsDicaBeacon {
  dicaId: string;
  elementoAlvo: HTMLElement;
}

export function DicaBeacon({
  dicaId,
  elementoAlvo,
}: Readonly<PropsDicaBeacon>) {
  const abrir = useDicasStore((state) => state.abrir);
  const [posicao, setPosicao] = useState({ top: 0, left: 0 });

  useEffect(() => {
    function calcularPosicao() {
      const rect = elementoAlvo.getBoundingClientRect();
      setPosicao({
        top: rect.top + window.scrollY - 4,
        left: rect.right + window.scrollX - 4,
      });
    }

    calcularPosicao();
    window.addEventListener('scroll', calcularPosicao, { passive: true });
    window.addEventListener('resize', calcularPosicao);

    return () => {
      window.removeEventListener('scroll', calcularPosicao);
      window.removeEventListener('resize', calcularPosicao);
    };
  }, [elementoAlvo]);

  return createPortal(
    <button
      type="button"
      onClick={() => abrir(dicaId)}
      className="fixed z-[9998] flex items-center justify-center"
      style={{ top: posicao.top, left: posicao.left }}
      aria-label="Ver dica"
    >
      {/* Área de toque 44x44 invisível */}
      <span className="absolute h-11 w-11" />
      {/* Bolinha pulsante */}
      <span className="h-2 w-2 rounded-full bg-primaria animate-[pulse_1.5s_ease-in-out_infinite] shadow-[0_0_6px_rgba(22,163,74,0.6)]" />
    </button>,
    document.body,
  );
}
