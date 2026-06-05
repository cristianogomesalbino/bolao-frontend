'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar, Crosshair, Trophy, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { calcularPontos, PONTOS } from '@/lib/pontuacao';
import { PalpiteComJogo } from '@/types/palpite.types';
import { IconPalpite } from '@/components/icons/icon-palpite';

type FiltroTipo = 'todos' | 'cheio' | 'parcial' | 'nada';

interface PropsAbaMeusPalpites {
  palpitesFinalizados: PalpiteComJogo[];
  palpitesPorRodada: Record<number, PalpiteComJogo[]>;
  carregandoPalpites: boolean;
  buscandoPalpites: boolean;
  temporadaId: string;
}

export function AbaMeusPalpites({
  palpitesFinalizados,
  palpitesPorRodada,
  carregandoPalpites,
  buscandoPalpites,
  temporadaId,
}: Readonly<PropsAbaMeusPalpites>) {
  const [filtroRodada, setFiltroRodada] = useState<number | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos');
  const [dropdownRodadaAberto, setDropdownRodadaAberto] = useState(false);
  const [dropdownTipoAberto, setDropdownTipoAberto] = useState(false);
  const dropdownRodadaRef = useRef<HTMLDivElement>(null);
  const dropdownTipoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (dropdownRodadaAberto && dropdownRodadaRef.current && !dropdownRodadaRef.current.contains(e.target as Node)) {
        setDropdownRodadaAberto(false);
      }
      if (dropdownTipoAberto && dropdownTipoRef.current && !dropdownTipoRef.current.contains(e.target as Node)) {
        setDropdownTipoAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, [dropdownRodadaAberto, dropdownTipoAberto]);

  if (carregandoPalpites || buscandoPalpites || !temporadaId) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[80px] rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
        ))}
      </div>
    );
  }

  if (palpitesFinalizados.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <IconPalpite size={32} className="text-texto/15 mb-3" />
        <p className="text-texto/40 text-sm">Nenhum palpite anterior</p>
      </div>
    );
  }

  const listaFiltrada = filtroRodada ? palpitesPorRodada[filtroRodada] ?? [] : palpitesFinalizados;
  const totalEmCheio = listaFiltrada.filter((p) => calcularPontos(p) === PONTOS.ACERTO_EM_CHEIO).length;
  const totalPontos = listaFiltrada.reduce((acc, p) => acc + calcularPontos(p), 0);
  const aproveitamento = listaFiltrada.length > 0
    ? Math.round((listaFiltrada.filter((p) => calcularPontos(p) > 0).length / listaFiltrada.length) * 100)
    : 0;

  return (
    <div>
      {/* Filtros */}
      <FiltrosPalpites
        palpitesPorRodada={palpitesPorRodada}
        filtroRodada={filtroRodada}
        filtroTipo={filtroTipo}
        dropdownRodadaAberto={dropdownRodadaAberto}
        dropdownTipoAberto={dropdownTipoAberto}
        dropdownRodadaRef={dropdownRodadaRef}
        dropdownTipoRef={dropdownTipoRef}
        onFiltroRodada={setFiltroRodada}
        onFiltroTipo={setFiltroTipo}
        onDropdownRodada={setDropdownRodadaAberto}
        onDropdownTipo={setDropdownTipoAberto}
      />

      {/* Lista de palpites */}
      {Object.entries(palpitesPorRodada)
        .filter(([rodada]) => filtroRodada === null || Number(rodada) === filtroRodada)
        .sort(([a], [b]) => Number(b) - Number(a))
        .map(([rodada, palpites]) => {
          const palpitesFiltrados = palpites.filter((p: PalpiteComJogo) => {
            if (filtroTipo === 'todos') return true;
            const pts = calcularPontos(p);
            if (filtroTipo === 'cheio') return pts === PONTOS.ACERTO_EM_CHEIO;
            if (filtroTipo === 'parcial') return pts === PONTOS.ACERTO_RESULTADO;
            return pts === 0;
          });
          if (palpitesFiltrados.length === 0) return null;
          return (
            <div key={rodada} className="mb-4">
              {filtroRodada === null && (
                <div className="flex items-center gap-3 py-2 mb-2">
                  <span className="h-px flex-1 bg-white/[0.06]" />
                  <span className="text-[11px] text-texto/60 font-semibold uppercase tracking-wider">Rodada {rodada}</span>
                  <span className="h-px flex-1 bg-white/[0.06]" />
                </div>
              )}
              <div className="space-y-2">
                {palpitesFiltrados.map((p: PalpiteComJogo) => (
                  <CardPalpiteHistorico key={p.id} palpite={p} />
                ))}
              </div>
            </div>
          );
        })}

      {/* Resumo fixo */}
      <ResumoPalpites totalEmCheio={totalEmCheio} totalPontos={totalPontos} aproveitamento={aproveitamento} />
    </div>
  );
}

// --- Sub-componentes ---

function CardPalpiteHistorico({ palpite: p }: Readonly<{ palpite: PalpiteComJogo }>) {
  const pts = calcularPontos(p);
  const temPontos = pts > 0;

  return (
    <div
      className={`rounded-2xl border p-3 relative overflow-hidden bg-white/[0.04] backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.3)] ${
        temPontos ? 'border-primaria/40 shadow-[0_0_12px_rgba(34,197,94,0.15)]' : 'border-white/[0.12]'
      }`}
    >
      {temPontos && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl bg-gradient-to-b from-primaria via-primaria-claro to-primaria/30 shadow-[0_0_14px_rgba(34,197,94,0.6)]" />
      )}
      {pts === PONTOS.ACERTO_EM_CHEIO && (
        <>
          <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-xl bg-gradient-to-r from-primaria via-primaria-claro to-primaria/30 shadow-[0_0_14px_rgba(34,197,94,0.6)]" />
          <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-xl bg-gradient-to-r from-primaria/30 via-primaria-claro to-primaria shadow-[0_0_14px_rgba(34,197,94,0.6)]" />
        </>
      )}

      <div className="flex items-center gap-2">
        <EscudoTimePequeno time={p.jogo?.timeCasa} label="Casa" />
        <div className="flex flex-col items-center shrink-0 w-[140px]">
          <span className="text-[11px] text-texto/80 uppercase tracking-wide mb-1.5">Placar final</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-texto">{p.jogo?.golsCasa ?? 0}</span>
            <span className="text-sm font-bold text-texto/40">x</span>
            <span className="text-2xl font-bold text-texto">{p.jogo?.golsFora ?? 0}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="text-[9px] text-texto/40">Palpite:</span>
            <span className="text-[11px] font-semibold text-primaria-claro">{p.golsCasa} × {p.golsFora}</span>
          </div>
          <div className="mt-1.5">
            {temPontos ? (
              <span className="text-[10px] text-primaria font-semibold flex items-center gap-1">+{pts} {pts > 1 ? 'pontos' : 'ponto'} {pts === PONTOS.ACERTO_EM_CHEIO ? '🎯' : '✓'}</span>
            ) : (
              <span className="text-[10px] text-texto/30">0 pontos</span>
            )}
          </div>
        </div>
        <EscudoTimePequeno time={p.jogo?.timeFora} label="Fora" />
      </div>
    </div>
  );
}

function EscudoTimePequeno({ time, label }: Readonly<{ time: { nome: string; sigla: string; escudo: string | null } | null | undefined; label: string }>) {
  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      <div className="relative h-14 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-white/30 blur-lg" />
        {time?.escudo ? (
          <Image src={time.escudo} alt={time.nome} width={56} height={56} className="relative h-14 w-14 object-contain" unoptimized />
        ) : (
          <div className="relative h-14 w-14 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] font-bold text-texto/50">
            {time?.sigla || '?'}
          </div>
        )}
      </div>
      <span className="text-xs text-texto font-medium truncate max-w-[70px]">{time?.nome || label}</span>
    </div>
  );
}

function ResumoPalpites({ totalEmCheio, totalPontos, aproveitamento }: Readonly<{ totalEmCheio: number; totalPontos: number; aproveitamento: number }>) {
  return (
    <div className="fixed bottom-[74px] left-0 right-0 z-20 px-4 safe-area-bottom">
      <div className="mx-auto max-w-[480px] py-3 px-2 bg-[#0d1a2d]/95 backdrop-blur-md border border-white/[0.15] rounded-xl">
        <div className="flex items-center justify-evenly">
          <div className="flex items-center gap-1.5">
            <Crosshair size={18} className="text-primaria-claro" />
            <div>
              <p className="text-[10px] text-texto/50 font-semibold">Em cheio</p>
              <p className="text-sm font-bold text-primaria">{totalEmCheio}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Trophy size={18} className="text-primaria-claro" />
            <div>
              <p className="text-[10px] text-texto/50 font-semibold">Pontuação</p>
              <p className="text-sm font-bold text-primaria">{totalPontos} pts</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp size={18} className="text-primaria-claro" />
            <div>
              <p className="text-[10px] text-texto/50 font-semibold">Aproveitamento</p>
              <p className="text-sm font-bold text-primaria">{aproveitamento}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PropsFiltros {
  palpitesPorRodada: Record<number, PalpiteComJogo[]>;
  filtroRodada: number | null;
  filtroTipo: FiltroTipo;
  dropdownRodadaAberto: boolean;
  dropdownTipoAberto: boolean;
  dropdownRodadaRef: React.RefObject<HTMLDivElement | null>;
  dropdownTipoRef: React.RefObject<HTMLDivElement | null>;
  onFiltroRodada: (v: number | null) => void;
  onFiltroTipo: (v: FiltroTipo) => void;
  onDropdownRodada: (v: boolean) => void;
  onDropdownTipo: (v: boolean) => void;
}

function FiltrosPalpites({
  palpitesPorRodada, filtroRodada, filtroTipo,
  dropdownRodadaAberto, dropdownTipoAberto,
  dropdownRodadaRef, dropdownTipoRef,
  onFiltroRodada, onFiltroTipo, onDropdownRodada, onDropdownTipo,
}: Readonly<PropsFiltros>) {
  const rodadas = Object.keys(palpitesPorRodada).map(Number).sort((a, b) => b - a);

  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[9px] text-texto/40 uppercase tracking-wider shrink-0">Filtrar por rodada</span>
      <button
        onClick={() => {
          if (filtroRodada === null) { onFiltroRodada(rodadas[0]); return; }
          const idx = rodadas.indexOf(filtroRodada);
          if (idx < rodadas.length - 1) onFiltroRodada(rodadas[idx + 1]);
        }}
        className="h-8 w-8 flex items-center justify-center rounded-lg border border-white/[0.12] text-texto/60 hover:text-texto text-lg"
      >
        ‹
      </button>
      <div ref={dropdownRodadaRef} className="relative flex-1">
        <button
          type="button"
          onClick={() => onDropdownRodada(!dropdownRodadaAberto)}
          className="w-full bg-white/[0.04] border border-primaria/50 rounded-lg pl-8 pr-6 py-2 text-xs text-texto text-center cursor-pointer focus:border-primaria focus:outline-none shadow-[0_0_8px_rgba(34,197,94,0.1)]"
        >
          {filtroRodada ? `Rodada ${filtroRodada}` : 'Todas'}
        </button>
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-primaria-claro"><Calendar size={14} /></span>
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-primaria-claro pointer-events-none text-[10px]">▼</span>

        {dropdownRodadaAberto && (
          <div className="absolute z-20 top-full mt-1 left-0 right-0 rounded-xl border border-white/[0.12] bg-[#0d1a2d] shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-2">
            <button
              type="button"
              onClick={() => { onFiltroRodada(null); onDropdownRodada(false); }}
              className={`w-full py-2 mb-1 text-xs text-center rounded-lg transition-colors ${
                filtroRodada === null ? 'text-primaria-claro bg-primaria/15' : 'text-texto/70 hover:bg-white/[0.06]'
              }`}
            >
              Todas
            </button>
            <div className="grid grid-cols-5 gap-1.5">
              {rodadas.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => { onFiltroRodada(r); onDropdownRodada(false); }}
                  className={`py-2 text-[11px] text-center rounded-lg font-medium transition-colors ${
                    filtroRodada === r ? 'text-primaria-claro bg-primaria/15' : 'text-texto/60 hover:bg-white/[0.06]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <button
        onClick={() => {
          if (filtroRodada === null) return;
          const idx = rodadas.indexOf(filtroRodada);
          if (idx > 0) onFiltroRodada(rodadas[idx - 1]);
          else onFiltroRodada(null);
        }}
        disabled={filtroRodada === null}
        className={`h-8 w-8 flex items-center justify-center rounded-lg border border-white/[0.12] text-lg ${
          filtroRodada === null ? 'text-texto/20 cursor-not-allowed' : 'text-texto/60 hover:text-texto'
        }`}
      >
        ›
      </button>
      <div ref={dropdownTipoRef} className="relative">
        <button
          type="button"
          onClick={() => onDropdownTipo(!dropdownTipoAberto)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[11px] font-semibold transition-colors ${
            filtroTipo === 'todos' ? 'bg-white/[0.04] text-texto/60 border-white/[0.12]' : 'bg-primaria/10 text-primaria-claro border-primaria/50'
          }`}
        >
          {filtroTipo === 'todos' && '⚽ Filtros'}
          {filtroTipo === 'cheio' && '🎯 Em cheio'}
          {filtroTipo === 'parcial' && '✓ Parcial'}
          {filtroTipo === 'nada' && '✗ Errou'}
        </button>
        {dropdownTipoAberto && (
          <div className="absolute z-20 top-full mt-1 right-0 w-36 rounded-xl border border-white/[0.12] bg-[#0d1a2d] shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-1.5">
            {([
              { valor: 'todos', icone: '⚽', label: 'Todos' },
              { valor: 'cheio', icone: '🎯', label: 'Em cheio' },
              { valor: 'parcial', icone: '✓', label: 'Parcial' },
              { valor: 'nada', icone: '✗', label: 'Errou' },
            ] as const).map((item) => (
              <button
                key={item.valor}
                type="button"
                onClick={() => { onFiltroTipo(item.valor); onDropdownTipo(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-colors ${
                  filtroTipo === item.valor ? 'text-primaria-claro bg-primaria/15' : 'text-texto/70 hover:bg-white/[0.06]'
                }`}
              >
                <span>{item.icone}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
