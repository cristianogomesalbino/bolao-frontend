'use client';

import { createPortal } from 'react-dom';
import { useEffect, useCallback, useRef, useLayoutEffect } from 'react';
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

type PosicaoEfetiva = Exclude<PosicaoDica, 'auto'>;

const ESPACAMENTO = 12;
const CLASSE_DESTAQUE = 'ring-2 ring-primaria ring-offset-2 ring-offset-fundo rounded-lg transition-all duration-300 relative z-10';

function calcularPosicaoFixa(
  rect: DOMRect,
  posicao: PosicaoDica,
  largura: number,
  altura: number,
): { top: number; left: number; posicaoFinal: PosicaoEfetiva } {
  const posicaoFinal: PosicaoEfetiva = posicao === 'auto' ? 'bottom' : posicao;

  let top = 0;
  let left = 0;

  switch (posicaoFinal) {
    case 'bottom':
      top = rect.bottom + ESPACAMENTO;
      left = rect.left + rect.width / 2 - largura / 2;
      break;
    case 'top':
      top = rect.top - altura - ESPACAMENTO;
      left = rect.left + rect.width / 2 - largura / 2;
      break;
    case 'left':
      top = rect.top + rect.height / 2 - altura / 2;
      left = rect.left - largura - ESPACAMENTO;
      break;
    case 'right':
      top = rect.top + rect.height / 2 - altura / 2;
      left = rect.right + ESPACAMENTO;
      break;
  }

  // Correção de transbordo horizontal
  const maxLeft = window.innerWidth - largura - 16;
  left = Math.max(16, Math.min(left, maxLeft));

  return { top, left, posicaoFinal };
}

function calcularSetaFixa(
  rect: DOMRect,
  posicaoFinal: PosicaoEfetiva,
): { top: number; left: number; rotacao: string } {
  switch (posicaoFinal) {
    case 'bottom':
      return { top: rect.bottom + 2, left: rect.left + rect.width / 2, rotacao: 'rotate(0deg)' };
    case 'top':
      return { top: rect.top - 2, left: rect.left + rect.width / 2, rotacao: 'rotate(180deg)' };
    case 'left':
      return { top: rect.top + rect.height / 2, left: rect.left - 2, rotacao: 'rotate(90deg)' };
    case 'right':
      return { top: rect.top + rect.height / 2, left: rect.right + 2, rotacao: 'rotate(-90deg)' };
  }
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
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Destacar elemento-alvo
  useEffect(() => {
    elementoAlvo.classList.add(...CLASSE_DESTAQUE.split(' '));
    return () => {
      elementoAlvo.classList.remove(...CLASSE_DESTAQUE.split(' '));
    };
  }, [elementoAlvo]);

  // Posicionar via useLayoutEffect — scroll instantâneo + calcula posição
  useLayoutEffect(() => {
    const tooltip = tooltipRef.current;
    if (!tooltip) return;

    // Scroll instantâneo para garantir elemento no viewport
    elementoAlvo.scrollIntoView({ behavior: 'instant', block: 'center' });

    // Calcular posição após scroll (síncrono com instant)
    requestAnimationFrame(() => {
      const rect = elementoAlvo.getBoundingClientRect();
      const largura = tooltip.offsetWidth || 280;
      const altura = tooltip.offsetHeight || 120;

      const { top, left, posicaoFinal } = calcularPosicaoFixa(rect, posicao, largura, altura);
      const seta = calcularSetaFixa(rect, posicaoFinal);

      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;

      const setaEl = tooltip.previousElementSibling as HTMLElement | null;
      if (setaEl) {
        setaEl.style.top = `${seta.top}px`;
        setaEl.style.left = `${seta.left}px`;
        setaEl.style.transform = `translate(-50%, -50%) ${seta.rotacao}`;
      }
    });
  }, [elementoAlvo, posicao]);

  // Escape para fechar
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
    <>
      {/* Seta apontando para o elemento */}
      <div
        className="fixed z-[9999] pointer-events-none"
        style={{ top: 0, left: 0 }}
      >
        <svg width="18" height="10" viewBox="0 0 18 10" fill="none">
          <path
            d="M9 0L17.6603 10H0.339746L9 0Z"
            fill="#16a34a"
          />
        </svg>
      </div>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        id={`tooltip-content-${dicaId}`}
        role="tooltip"
        aria-live="polite"
        className="fixed z-[9999] max-w-[280px] p-4 rounded-2xl border border-primaria/40 bg-[#0f1a2e]/95 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.5),0_0_20px_rgba(22,163,74,0.15)] animate-[fadeIn_0.2s_ease-out]"
        style={{ top: 0, left: 0 }}
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
      </div>
    </>,
    document.body,
  );
}
