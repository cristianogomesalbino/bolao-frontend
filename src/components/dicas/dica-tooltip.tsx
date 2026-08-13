'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState, useCallback, useRef } from 'react';
import type { PosicaoDica } from '@/types/dica.types';

interface PropsDicaTooltip {
  dicaId: string;
  titulo: string;
  conteudo: string;
  posicao: PosicaoDica;
  elementoAlvo: HTMLElement;
  aoDispensar: () => void;
  aoFechar: () => void;
}

interface Coordenadas {
  top: number;
  left: number;
}

function calcularPosicaoTooltip(
  elementoAlvo: HTMLElement,
  posicao: PosicaoDica,
  larguraTooltip: number,
  alturaTooltip: number,
): Coordenadas {
  const rect = elementoAlvo.getBoundingClientRect();
  const espacamento = 12;

  const calculos: Record<Exclude<PosicaoDica, 'auto'>, Coordenadas> = {
    top: {
      top: rect.top + window.scrollY - alturaTooltip - espacamento,
      left: rect.left + window.scrollX + rect.width / 2 - larguraTooltip / 2,
    },
    bottom: {
      top: rect.bottom + window.scrollY + espacamento,
      left: rect.left + window.scrollX + rect.width / 2 - larguraTooltip / 2,
    },
    left: {
      top: rect.top + window.scrollY + rect.height / 2 - alturaTooltip / 2,
      left: rect.left + window.scrollX - larguraTooltip - espacamento,
    },
    right: {
      top: rect.top + window.scrollY + rect.height / 2 - alturaTooltip / 2,
      left: rect.right + window.scrollX + espacamento,
    },
  };

  const posicaoEfetiva = posicao === 'auto' ? 'bottom' : posicao;
  const coords = calculos[posicaoEfetiva];

  // Correção de transbordo horizontal
  const maxLeft = window.innerWidth - larguraTooltip - 16;
  coords.left = Math.max(16, Math.min(coords.left, maxLeft));

  return coords;
}

export function DicaTooltip({
  dicaId,
  titulo,
  conteudo,
  posicao,
  elementoAlvo,
  aoDispensar,
  aoFechar,
}: Readonly<PropsDicaTooltip>) {
  const [coords, setCoords] = useState<Coordenadas>({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function atualizar() {
      const largura = tooltipRef.current?.offsetWidth ?? 280;
      const altura = tooltipRef.current?.offsetHeight ?? 120;
      setCoords(calcularPosicaoTooltip(elementoAlvo, posicao, largura, altura));
    }

    atualizar();
    window.addEventListener('resize', atualizar);
    window.addEventListener('scroll', atualizar, { passive: true });

    return () => {
      window.removeEventListener('resize', atualizar);
      window.removeEventListener('scroll', atualizar);
    };
  }, [elementoAlvo, posicao]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') aoFechar();
    },
    [aoFechar],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return createPortal(
    <div
      ref={tooltipRef}
      role="tooltip"
      className="fixed z-[9999] max-w-[280px] p-4 rounded-2xl border border-white/[0.12] bg-[#0f1a2e]/95 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.5)] animate-[fadeIn_0.2s_ease-out]"
      style={{ top: coords.top, left: coords.left }}
      data-testid={`tooltip-${dicaId}`}
    >
      <h3 className="text-sm font-semibold text-texto mb-1.5">{titulo}</h3>
      <p className="text-xs text-texto/70 leading-relaxed mb-4">{conteudo}</p>
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={aoDispensar}
          className="text-[11px] px-4 py-1.5 rounded-lg bg-primaria text-white font-semibold hover:bg-primaria-claro transition-colors shadow-[0_0_12px_rgba(22,163,74,0.4)]"
          data-testid={`tooltip-entendi-${dicaId}`}
        >
          Entendi
        </button>
      </div>
    </div>,
    document.body,
  );
}
