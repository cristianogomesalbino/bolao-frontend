'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';
import { getDicasPorPagina } from '@/lib/dica-registry';
import { useDicasStore } from '@/stores/dicas.store';
import { DicaBeacon } from './dica-beacon';
import { DicaTooltip } from './dica-tooltip';
import type { ConfiguracaoDica } from '@/types/dica.types';

const INTERVALO_AUTO_EXIBICAO = 500;

export function DicasProvider() {
  const pathname = usePathname();
  const dicasDaPagina = getDicasPorPagina(pathname);

  const dicaAtiva = useDicasStore((s) => s.dicaAtiva);
  const obterEstado = useDicasStore((s) => s.obterEstado);
  const dispensarDica = useDicasStore((s) => s.dispensarDica);
  const marcarComoExibida = useDicasStore((s) => s.marcarComoExibida);
  const abrirDica = useDicasStore((s) => s.abrirDica);
  const fecharDica = useDicasStore((s) => s.fecharDica);
  const enfileirar = useDicasStore((s) => s.enfileirar);
  const desenfileirar = useDicasStore((s) => s.desenfileirar);

  const [elementosVisiveis, setElementosVisiveis] = useState<
    Map<string, HTMLElement>
  >(new Map());

  const observerRef = useRef<IntersectionObserver | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processandoRef = useRef(false);

  // Processa a fila de auto-exibição: um por vez com intervalo
  const processarFila = useCallback(() => {
    if (processandoRef.current) return;
    if (dicaAtiva) return;

    const proximaDica = desenfileirar();
    if (!proximaDica) return;

    processandoRef.current = true;
    abrirDica(proximaDica);

    // Marca como exibida quando o timeout de auto-exibição expira
    // (o tooltip fica aberto até o usuário interagir)
  }, [dicaAtiva, desenfileirar, abrirDica]);

  // Quando dicaAtiva muda para null (fechou), processa próxima após intervalo
  useEffect(() => {
    if (dicaAtiva === null && processandoRef.current) {
      processandoRef.current = false;
      timerRef.current = setTimeout(processarFila, INTERVALO_AUTO_EXIBICAO);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dicaAtiva, processarFila]);

  // Configura IntersectionObserver para detectar elementos com data-dica
  useEffect(() => {
    if (dicasDaPagina.length === 0) return;

    const mapaAlvos = new Map<string, ConfiguracaoDica>();
    dicasDaPagina.forEach((d) => mapaAlvos.set(d.target, d));

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const elemento = entry.target as HTMLElement;
          const dicaAttr = elemento.getAttribute('data-dica');
          if (!dicaAttr) return;

          const seletor = `[data-dica="${dicaAttr}"]`;
          const config = mapaAlvos.get(seletor);
          if (!config) return;

          if (entry.isIntersecting) {
            setElementosVisiveis((prev) => {
              const novo = new Map(prev);
              novo.set(config.dicaId, elemento);
              return novo;
            });

            const estado = obterEstado(config.dicaId);
            if (estado === 'inedito') {
              enfileirar(config.dicaId);
            }
          } else {
            setElementosVisiveis((prev) => {
              const novo = new Map(prev);
              novo.delete(config.dicaId);
              return novo;
            });
          }
        });
      },
      { threshold: 0.5 },
    );

    // Observar elementos existentes e futuros via MutationObserver
    function observarElementos() {
      const elementos = document.querySelectorAll('[data-dica]');
      elementos.forEach((el) => observerRef.current?.observe(el));
    }

    observarElementos();

    const mutationObserver = new MutationObserver(() => {
      observarElementos();
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observerRef.current?.disconnect();
      mutationObserver.disconnect();
    };
  }, [pathname, dicasDaPagina, obterEstado, enfileirar]);

  // Dispara processamento da fila quando há itens enfileirados e nenhuma dica ativa
  useEffect(() => {
    if (!dicaAtiva && !processandoRef.current) {
      processarFila();
    }
  }, [dicaAtiva, processarFila]);

  // Handlers
  function handleDispensar(dicaId: string) {
    dispensarDica(dicaId);
  }

  function handleFechar(dicaId: string) {
    marcarComoExibida(dicaId);
    fecharDica();
  }

  function handleBeaconClick(dicaId: string) {
    abrirDica(dicaId);
  }

  // Renderização
  const dicaAtivaConfig = dicasDaPagina.find((d) => d.dicaId === dicaAtiva);
  const elementoAtivo = dicaAtiva ? elementosVisiveis.get(dicaAtiva) : null;

  return (
    <>
      {/* Beacons para dicas já exibidas mas não dispensadas */}
      {dicasDaPagina
        .filter(
          (d) =>
            obterEstado(d.dicaId) === 'exibido' &&
            elementosVisiveis.has(d.dicaId) &&
            d.dicaId !== dicaAtiva,
        )
        .map((d) => (
          <DicaBeacon
            key={d.dicaId}
            dicaId={d.dicaId}
            elementoAlvo={elementosVisiveis.get(d.dicaId)!}
            aoClicar={() => handleBeaconClick(d.dicaId)}
          />
        ))}

      {/* Tooltip ativo */}
      {dicaAtivaConfig && elementoAtivo && (
        <DicaTooltip
          dicaId={dicaAtivaConfig.dicaId}
          titulo={dicaAtivaConfig.titulo}
          conteudo={dicaAtivaConfig.conteudo}
          posicao={dicaAtivaConfig.posicao}
          elementoAlvo={elementoAtivo}
          aoDispensar={() => handleDispensar(dicaAtivaConfig.dicaId)}
          aoFechar={() => handleFechar(dicaAtivaConfig.dicaId)}
        />
      )}
    </>
  );
}
