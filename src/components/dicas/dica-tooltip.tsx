'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState, useCallback, useRef } from 'react';

interface PropsDicaTooltip {
  dicaId: string;
  titulo: string;
  conteudo: string;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  elementoAlvo: HTMLElement;
  aoDispensar: () => void;
  aoFechar: () => void;
}

interface Posicao {
  top: number;
  left: number;
}

function calcularPosicaoTooltip(
  elemento: HTMLElement,
  placement: string,
  larguraTooltip: number,
  alturaTooltip: number,
): Posicao {
  const rect = elemento.getBoundingClientRect();
  const scrollY = window.scrollY;
  const scrollX = window.scrollX;
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;
  const gap = 8;

  let top = 0;
  let left = 0;

  const placementEfetivo = placement === 'auto' ? 'bottom' : placement;

  switch (placementEfetivo) {
    case 'bottom':
      top = rect.bottom + scrollY + gap;
      left = rect.left + scrollX + rect.width / 2 - larguraTooltip / 2;
      break;
    case 'top':
      top = rect.top + scrollY - alturaTooltip - gap;
      left = rect.left + scrollX + rect.width / 2 - larguraTooltip / 2;
      break;
    case 'left':
      top = rect.top + scrollY + rect.height / 2 - alturaTooltip / 2;
      left = rect.left + scrollX - larguraTooltip - gap;
      break;
    case 'right':
      top = rect.top + scrollY + rect.height / 2 - alturaTooltip / 2;
      left = rect.right + scrollX + gap;
      break;
  }

  // Corrigir transbordo horizontal
  if (left < 8) left = 8;
  if (left + larguraTooltip > viewportW - 8) {
    left = viewportW - larguraTooltip - 8;
  }

  // Corrigir transbordo vertical
  if (top < scrollY + 8) top = scrollY + 8;
  if (top - scrollY + alturaTooltip > viewportH - 8) {
    top = scrollY + viewportH - alturaTooltip - 8;
  }

  return { top, left };
}

export function DicaTooltip({
  dicaId,
  titulo,
  conteudo,
  placement,
  elementoAlvo,
  aoDispensar,
  aoFechar,
}: Readonly<PropsDicaTooltip>) {
  const [posicao, setPosicao] = useState<Posicao>({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const recalcular = useCallback(() => {
    const largura = tooltipRef.current?.offsetWidth ?? 280;
    const altura = tooltipRef.current?.offsetHeight ?? 120;
    setPosicao(calcularPosicaoTooltip(elementoAlvo, placement, largura, altura));
  }, [elementoAlvo, placement]);

  useEffect(() => {
    recalcular();
    window.addEventListener('scroll', recalcular, { passive: true });
    window.addEventListener('resize', recalcular);
    return () => {
      window.removeEventListener('scroll', recalcular);
      window.removeEventListener('resize', recalcular);
    };
  }, [recalcular]);

  // Fechar com Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') aoFechar();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [aoFechar]);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(e.target as Node) &&
        !elementoAlvo.contains(e.target as Node)
      ) {
        aoFechar();
      }
    }
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, [aoFechar, elementoAlvo]);

  return createPortal(
    <div
      ref={tooltipRef}
      role="tooltip"
      aria-describedby={dicaId}
      className="fixed z-[9999] max-w-[280px] p-4 rounded-2xl border border-white/[0.12] bg-[#0f1a2e]/95 backdrop-blur-2xl shadow-[0_8px_40px_rgba(0,0,0,0.5)] animate-[fadeIn_0.15s_ease-out]"
      style={{ top: posicao.top, left: posicao.left }}
    >
      <h3 className="text-sm font-semibold text-texto mb-1.5">{titulo}</h3>
      <p className="text-xs text-texto/70 leading-relaxed mb-4">{conteudo}</p>
      <button
        type="button"
        onClick={aoDispensar}
        className="text-[11px] px-4 py-1.5 rounded-lg bg-primaria text-white font-semibold hover:bg-primaria-claro transition-colors shadow-[0_0_12px_rgba(22,163,74,0.4)]"
      >
        Entendi
      </button>
    </div>,
    document.body,
  );
}
