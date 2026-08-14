'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';

interface PropsDicaBeacon {
  dicaId: string;
  elementoAlvo: HTMLElement;
  aoClicar: () => void;
}

export function DicaBeacon({
  dicaId,
  elementoAlvo,
  aoClicar,
}: Readonly<PropsDicaBeacon>) {
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

    const observer = new ResizeObserver(calcularPosicao);
    observer.observe(elementoAlvo);
    window.addEventListener('scroll', calcularPosicao, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', calcularPosicao);
    };
  }, [elementoAlvo]);

  return createPortal(
    <button
      type="button"
      onClick={aoClicar}
      aria-label={`Dica disponível: ${dicaId}`}
      className="fixed z-[9998] flex items-center justify-center w-[44px] h-[44px] -translate-x-1/2 -translate-y-1/2 cursor-pointer"
      style={{ top: posicao.top, left: posicao.left }}
      data-testid={`beacon-${dicaId}`}
    >
      <span className="block h-2 w-2 rounded-full bg-primaria animate-[pulso_1.5s_ease-in-out_infinite] shadow-[0_0_6px_rgba(22,163,74,0.6)]" />
    </button>,
    document.body,
  );
}
