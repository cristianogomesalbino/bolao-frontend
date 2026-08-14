'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { marcarVisualizados } from '@/services/destaques.service';
import { DESTAQUE_CONFIG } from '@/types/destaques.types';
import type { DestaqueItem } from '@/types/destaques.types';
import { DestaqueCard } from './destaque-card';
import { DestaqueProgressBar } from './destaque-progress-bar';

interface DestaqueViewerProps {
  readonly destaques: DestaqueItem[];
  readonly grupoId: string;
  readonly indiceInicial: number;
  readonly onClose: () => void;
}

export function DestaqueViewer({
  destaques,
  grupoId,
  indiceInicial,
  onClose,
}: DestaqueViewerProps) {
  const [indiceAtual, setIndiceAtual] = useState(indiceInicial);
  const [pausado, setPausado] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const visualizadosRef = useRef<Set<string>>(new Set());

  const destaqueAtual = destaques[indiceAtual];
  const timerDuracao = destaqueAtual
    ? DESTAQUE_CONFIG[destaqueAtual.tipo].timerSegundos * 1000
    : 5000;

  const ehUltimo = indiceAtual >= destaques.length - 1;
  const ehPrimeiro = indiceAtual <= 0;

  // Registrar visualização
  useEffect(() => {
    if (destaqueAtual && !visualizadosRef.current.has(destaqueAtual.id)) {
      visualizadosRef.current.add(destaqueAtual.id);
    }
  }, [destaqueAtual]);

  // Auto-advance timer
  useEffect(() => {
    if (pausado || ehUltimo) return;

    setProgresso(0);
    const inicio = Date.now();
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - inicio;
      const pct = Math.min(elapsed / timerDuracao, 1);
      setProgresso(pct);

      if (pct >= 1) {
        avancar();
      }
    }, 50);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indiceAtual, pausado, ehUltimo, timerDuracao]);

  const avancar = useCallback(() => {
    if (ehUltimo) return;
    setIndiceAtual((prev) => prev + 1);
    setProgresso(0);
  }, [ehUltimo]);

  const voltar = useCallback(() => {
    if (ehPrimeiro) return;
    setIndiceAtual((prev) => prev - 1);
    setProgresso(0);
  }, [ehPrimeiro]);

  const fechar = useCallback(() => {
    // Batch de visualizações
    const destaqueIds = Array.from(visualizadosRef.current);
    if (destaqueIds.length > 0) {
      marcarVisualizados(grupoId, destaqueIds).catch(() => {});
    }
    onClose();
  }, [grupoId, onClose]);

  // Touch handlers
  function handleTouchStart(e: React.TouchEvent) {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (!touchStartRef.current) return;
    const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x;
    const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;

    // Swipe-down para fechar
    if (deltaY > 100 && Math.abs(deltaX) < 50) {
      fechar();
      return;
    }

    // Swipe horizontal
    if (Math.abs(deltaX) > 50) {
      if (deltaX < 0) avancar();
      else voltar();
    }

    touchStartRef.current = null;
  }

  // Tap navigation (metade esquerda/direita)
  function handleTap(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    // Não ativar navegação em botões interativos
    if (target.closest('[data-interactive]')) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const metade = rect.width / 2;

    if (x > metade) avancar();
    else voltar();
  }

  // Long press para pausar
  function handlePointerDown() {
    setPausado(true);
  }

  function handlePointerUp() {
    setPausado(false);
  }

  if (!destaqueAtual) return null;

  return (
    <dialog
      open
      className="fixed inset-0 z-50 bg-black w-full h-full m-0 p-0 border-0"
      data-testid="destaque-viewer"
      aria-label="Visualizador de destaques"
      onKeyDown={(e) => {
        if (e.key === 'Escape') fechar();
        if (e.key === 'ArrowRight') avancar();
        if (e.key === 'ArrowLeft') voltar();
      }}
    >
      <div
        role="toolbar"
        aria-label="Navegação de destaques"
        tabIndex={-1}
        className="flex flex-col w-full h-full"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') avancar();
          if (e.key === 'ArrowLeft') voltar();
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleTap}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
      {/* Barra de progresso */}
      <DestaqueProgressBar
        total={destaques.length}
        atual={indiceAtual}
        progresso={progresso}
      />

      {/* Header: avatar + nome + tempo + fechar */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-white">
            {destaqueAtual.autor.nome.charAt(0).toUpperCase()}
          </div>
          <span className="text-white text-sm font-medium">
            {destaqueAtual.autor.nome.split(' ')[0]}
          </span>
          <span className="text-gray-400 text-xs">
            {formatarTempoRelativo(destaqueAtual.criadoEm)}
          </span>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            fechar();
          }}
          className="text-white text-2xl p-1"
          data-interactive
          aria-label="Fechar destaques"
        >
          ✕
        </button>
      </div>

      {/* Conteúdo do Destaque */}
      <div className="flex-1 flex items-center justify-center px-4">
        <DestaqueCard destaque={destaqueAtual} grupoId={grupoId} />
      </div>

      {/* Indicador de fim */}
      {ehUltimo && progresso >= 1 && (
        <div className="absolute bottom-8 left-0 right-0 text-center">
          <p className="text-gray-400 text-sm">Fim dos destaques</p>
        </div>
      )}
      </div>
    </dialog>
  );
}

function formatarTempoRelativo(criadoEm: string): string {
  const diffMs = Date.now() - new Date(criadoEm).getTime();
  const minutos = Math.floor(diffMs / 60000);
  if (minutos < 60) return `há ${minutos}min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 48) return `há ${horas}h`;
  const dias = Math.floor(horas / 24);
  return `há ${dias}d`;
}
