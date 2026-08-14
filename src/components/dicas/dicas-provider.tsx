'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { getDicasPorPagina } from '@/lib/dica-registry';
import { useDicasStore } from '@/stores/dicas.store';
import { DicaBeacon } from './dica-beacon';
import { DicaTooltip } from './dica-tooltip';
import type { ConfiguracaoDica } from '@/types/dica.types';

const DELAY_INICIAL = 1500;
const DELAY_ENTRE_DICAS = 800;

function buscarElementoDica(config: ConfiguracaoDica): HTMLElement | null {
  const regex = /\[data-dica="(.+?)"\]/;
  const match = regex.exec(config.target);
  if (!match) return null;
  return document.querySelector<HTMLElement>(`[data-dica="${match[1]}"]`);
}

function buscarProximaInedita(
  dicas: ConfiguracaoDica[],
  jaExibidas: Set<string>,
  obterEstado: (id: string) => string,
): ConfiguracaoDica | undefined {
  return dicas.find((d) => {
    if (jaExibidas.has(d.dicaId)) return false;
    if (obterEstado(d.dicaId) !== 'inedito') return false;
    return buscarElementoDica(d) !== null;
  });
}

export function DicasProvider() {
  const pathname = usePathname();
  const dicasDaPagina = getDicasPorPagina(pathname);

  const dicaAtiva = useDicasStore((s) => s.dicaAtiva);
  const obterEstado = useDicasStore((s) => s.obterEstado);
  const dispensarDica = useDicasStore((s) => s.dispensarDica);
  const marcarComoExibida = useDicasStore((s) => s.marcarComoExibida);
  const abrirDica = useDicasStore((s) => s.abrirDica);
  const fecharDica = useDicasStore((s) => s.fecharDica);

  const [prontoParaExibir, setProntoParaExibir] = useState(false);
  const [mutacaoContador, setMutacaoContador] = useState(0);
  const jaAutoExibidasRef = useRef<Set<string>>(new Set());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Delay inicial para esperar a página renderizar
  useEffect(() => {
    setProntoParaExibir(false);
    jaAutoExibidasRef.current = new Set();
    const timer = setTimeout(() => setProntoParaExibir(true), DELAY_INICIAL);
    return () => clearTimeout(timer);
  }, [pathname]);

  // MutationObserver: detecta novos [data-dica] no DOM e notifica
  useEffect(() => {
    if (!prontoParaExibir) return;

    const observer = new MutationObserver(() => {
      setMutacaoContador((c) => c + 1);
    });

    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [prontoParaExibir]);

  // Tenta exibir próxima dica inédita
  const tentarExibirProxima = useCallback(() => {
    if (dicaAtiva) return;

    const proximaInedita = buscarProximaInedita(dicasDaPagina, jaAutoExibidasRef.current, obterEstado);
    if (!proximaInedita) return;

    jaAutoExibidasRef.current.add(proximaInedita.dicaId);
    abrirDica(proximaInedita.dicaId);
  }, [dicaAtiva, dicasDaPagina, obterEstado, abrirDica]);

  // Auto-exibir quando pronto ou quando DOM muda (novos elementos aparecem)
  useEffect(() => {
    if (!prontoParaExibir || dicaAtiva) return;
    tentarExibirProxima();
  }, [prontoParaExibir, dicaAtiva, mutacaoContador, tentarExibirProxima]);

  // Quando dica fecha, agendar próxima
  useEffect(() => {
    if (dicaAtiva !== null || !prontoParaExibir) return;

    timerRef.current = setTimeout(tentarExibirProxima, DELAY_ENTRE_DICAS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dicaAtiva, prontoParaExibir, tentarExibirProxima]);

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

  // Config da dica ativa
  const dicaAtivaConfig = dicasDaPagina.find((d) => d.dicaId === dicaAtiva);
  const elementoAtivo = dicaAtivaConfig ? buscarElementoDica(dicaAtivaConfig) : null;

  return (
    <>
      {/* Beacons para dicas já exibidas mas não dispensadas */}
      {dicasDaPagina
        .filter((d) => obterEstado(d.dicaId) === 'exibido' && d.dicaId !== dicaAtiva)
        .map((d) => {
          const elemento = buscarElementoDica(d);
          if (!elemento) return null;
          return (
            <DicaBeacon
              key={d.dicaId}
              dicaId={d.dicaId}
              elementoAlvo={elemento}
              aoClicar={() => handleBeaconClick(d.dicaId)}
            />
          );
        })}

      {/* Tooltip ativo */}
      {dicaAtivaConfig && elementoAtivo && (
        <DicaTooltip
          key={dicaAtivaConfig.dicaId}
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
