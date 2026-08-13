'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useDicasStore } from '@/stores/dicas.store';
import { getDicasPorPagina } from '@/lib/dica-registry';
import { DicaBeacon } from './dica-beacon';
import { DicaTooltip } from './dica-tooltip';
import type { ConfiguracaoDica } from '@/types/dica.types';

const INTERVALO_AUTO_EXIBICAO = 500;

export function DicasProvider() {
  const pathname = usePathname();
  const obterEstado = useDicasStore((state) => state.obterEstado);
  const dicaAtiva = useDicasStore((state) => state.dicaAtiva);
  const dispensar = useDicasStore((state) => state.dispensar);
  const marcarComoExibida = useDicasStore((state) => state.marcarComoExibida);
  const abrir = useDicasStore((state) => state.abrir);
  const fechar = useDicasStore((state) => state.fechar);
  const enfileirar = useDicasStore((state) => state.enfileirar);
  const desenfileirar = useDicasStore((state) => state.desenfileirar);

  const [elementosVisiveis, setElementosVisiveis] = useState<
    Map<string, HTMLElement>
  >(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processandoFila = useRef(false);

  const dicas = getDicasPorPagina(pathname);

  // Processar fila de auto-exibição
  const processarFila = useCallback(() => {
    if (processandoFila.current) return;
    if (dicaAtiva) return;

    const proximo = desenfileirar();
    if (!proximo) return;

    processandoFila.current = true;
    abrir(proximo);

    // Resetar flag após exibição para permitir próxima
    timerRef.current = setTimeout(() => {
      processandoFila.current = false;
    }, INTERVALO_AUTO_EXIBICAO);
  }, [dicaAtiva, desenfileirar, abrir]);

  // Quando dicaAtiva fica null (dispensou ou fechou), processar próximo da fila
  useEffect(() => {
    if (dicaAtiva) return;
    const timer = setTimeout(processarFila, INTERVALO_AUTO_EXIBICAO);
    return () => clearTimeout(timer);
  }, [dicaAtiva, processarFila]);

  // Observar elementos via IntersectionObserver
  useEffect(() => {
    if (dicas.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          const dicaId = obterDicaIdDoElemento(target, dicas);
          if (!dicaId) return;

          if (entry.isIntersecting) {
            setElementosVisiveis((prev) => {
              const novo = new Map(prev);
              novo.set(dicaId, target);
              return novo;
            });

            const estado = obterEstado(dicaId);
            if (estado === 'inedito') {
              enfileirar(dicaId);
            }
          } else {
            setElementosVisiveis((prev) => {
              const novo = new Map(prev);
              novo.delete(dicaId);
              return novo;
            });
          }
        });
      },
      { threshold: 0.5 },
    );

    observerRef.current = observer;

    // Observar elementos existentes
    dicas.forEach((dica) => {
      const el = document.querySelector(dica.target);
      if (el) observer.observe(el);
    });

    // MutationObserver para elementos que aparecem depois
    const mutationObserver = new MutationObserver(() => {
      dicas.forEach((dica) => {
        const el = document.querySelector(dica.target);
        if (el && !el.dataset.dicaObservado) {
          el.dataset.dicaObservado = 'true';
          observer.observe(el);
        }
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname, dicas.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handlers
  function handleDispensar(dicaId: string) {
    dispensar(dicaId);
    processandoFila.current = false;
  }

  function handleFechar(dicaId: string) {
    marcarComoExibida(dicaId);
    fechar();
    processandoFila.current = false;
  }

  // Encontrar dica ativa para renderizar tooltip
  const dicaAtivaConfig = dicas.find((d) => d.dicaId === dicaAtiva);
  const elementoAtivo = dicaAtiva
    ? elementosVisiveis.get(dicaAtiva) ?? null
    : null;

  return (
    <>
      {/* Beacons para dicas no estado 'exibido' */}
      {dicas
        .filter((dica) => obterEstado(dica.dicaId) === 'exibido')
        .map((dica) => {
          const el = elementosVisiveis.get(dica.dicaId);
          if (!el) return null;
          return (
            <DicaBeacon
              key={dica.dicaId}
              dicaId={dica.dicaId}
              elementoAlvo={el}
            />
          );
        })}

      {/* Tooltip ativo */}
      {dicaAtivaConfig && elementoAtivo && (
        <DicaTooltip
          dicaId={dicaAtivaConfig.dicaId}
          titulo={dicaAtivaConfig.titulo}
          conteudo={dicaAtivaConfig.conteudo}
          placement={dicaAtivaConfig.placement}
          elementoAlvo={elementoAtivo}
          aoDispensar={() => handleDispensar(dicaAtivaConfig.dicaId)}
          aoFechar={() => handleFechar(dicaAtivaConfig.dicaId)}
        />
      )}
    </>
  );
}

/** Resolve o dicaId de um elemento DOM baseado nos seletores do registry */
function obterDicaIdDoElemento(
  elemento: HTMLElement,
  dicas: ConfiguracaoDica[],
): string | null {
  for (const dica of dicas) {
    if (elemento.matches(dica.target)) return dica.dicaId;
  }
  return null;
}
