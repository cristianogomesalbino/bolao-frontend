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
}

export function DestaqueViewer({ destaques, grupoId }: DestaqueViewerProps) {
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [largura, setLargura] = useState(0);
  const [acabou, setAcabou] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inicioRef = useRef(0);
  const acumuladoRef = useRef(0);
  const touchStartRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const segurouRef = useRef(false);
  const visualizadosRef = useRef<Set<string>>(new Set());

  const destaqueAtual = destaques[indiceAtual];
  const timerDuracao = destaqueAtual
    ? DESTAQUE_CONFIG[destaqueAtual.tipo].timerSegundos * 1000
    : 5000;

  const avancar = useCallback(() => {
    setIndiceAtual((atual) => {
      if (atual >= destaques.length - 1) {
        setAcabou(true);
        setProgresso(100);
        return atual;
      }
      return atual + 1;
    });
  }, [destaques.length]);

  const voltar = useCallback(() => {
    setAcabou(false);
    setIndiceAtual((atual) => Math.max(0, atual - 1));
  }, []);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const medir = () => setLargura(el.clientWidth);
    medir();
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!destaqueAtual || visualizadosRef.current.has(destaqueAtual.id)) return;
    const ids = destaqueAtual.idsAgrupados?.length
      ? destaqueAtual.idsAgrupados
      : [destaqueAtual.id];
    for (const id of ids) visualizadosRef.current.add(id);
  }, [destaqueAtual]);

  useEffect(() => {
    return () => {
      const ids = Array.from(visualizadosRef.current);
      if (ids.length > 0) {
        void marcarVisualizados(grupoId, ids).catch(() => undefined);
      }
    };
  }, [grupoId]);

  useEffect(() => {
    setProgresso(0);
    setAcabou(false);
    acumuladoRef.current = 0;
    inicioRef.current = Date.now();
  }, [indiceAtual]);

  useEffect(() => {
    if (pausado || acabou || !destaqueAtual) return;
    inicioRef.current = Date.now();
    timerRef.current = setInterval(() => {
      const decorrido = acumuladoRef.current + (Date.now() - inicioRef.current);
      const pct = Math.min(100, (decorrido / timerDuracao) * 100);
      setProgresso(pct);
      if (decorrido >= timerDuracao) {
        if (timerRef.current) clearInterval(timerRef.current);
        avancar();
      }
    }, 50);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [pausado, acabou, destaqueAtual, timerDuracao, avancar, indiceAtual]);

  function pausar() {
    acumuladoRef.current += Date.now() - inicioRef.current;
    setPausado(true);
  }

  function retomar() {
    inicioRef.current = Date.now();
    setPausado(false);
  }

  function aoPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const alvo = e.target as HTMLElement;
    if (alvo.closest('[data-interactive]')) return;
    touchStartRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    segurouRef.current = false;
    window.setTimeout(() => {
      if (touchStartRef.current && Date.now() - touchStartRef.current.t >= 180) {
        segurouRef.current = true;
        pausar();
      }
    }, 180);
  }

  function aoPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const inicio = touchStartRef.current;
    touchStartRef.current = null;
    if (!inicio) return;
    if (segurouRef.current) {
      retomar();
      return;
    }
    const dx = e.clientX - inicio.x;
    if (Math.abs(dx) > 40) {
      if (dx < 0) avancar();
      else voltar();
      return;
    }
    const metade = (frameRef.current?.clientWidth ?? 0) / 2;
    const local = e.clientX - (frameRef.current?.getBoundingClientRect().left ?? 0);
    if (local < metade) voltar();
    else avancar();
  }

  if (destaques.length === 0) return null;

  return (
    <div className="mx-auto w-[90%]" data-testid="destaque-viewer">
      <div
        ref={frameRef}
        className="relative mx-auto h-[46vh] max-h-[440px] min-h-[300px] w-full overflow-hidden rounded-2xl bg-black"
        onPointerDown={aoPointerDown}
        onPointerUp={aoPointerUp}
        onPointerLeave={() => {
          if (pausado) retomar();
          touchStartRef.current = null;
        }}
      >
        <div className="absolute inset-x-0 top-0 z-10 px-2 pt-1">
          <DestaqueProgressBar
            total={destaques.length}
            atual={indiceAtual}
            progresso={acabou ? 1 : progresso / 100}
          />
        </div>
        <div
          className="flex h-full transition-transform duration-300 ease-out"
          style={{
            width: largura > 0 ? largura * destaques.length : '100%',
            transform: largura > 0 ? `translate3d(${-indiceAtual * largura}px, 0, 0)` : undefined,
          }}
        >
          {destaques.map((item) => (
            <div key={item.id} className="h-full shrink-0" style={{ width: largura || '100%' }}>
              <DestaqueCard destaque={item} grupoId={grupoId} preencher />
            </div>
          ))}
        </div>
        {acabou && (
          <div className="absolute inset-0 flex items-end justify-center bg-black/40 pb-8">
            <p className="text-sm font-medium text-white">Fim dos destaques</p>
          </div>
        )}
      </div>
    </div>
  );
}
