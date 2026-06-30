'use client';

import { useState, useEffect, useRef } from 'react';
import { Crosshair, Trophy, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { calcularPontos, PONTOS } from '@/lib/pontuacao';
import { formatarPontuacao } from '@/lib/pontuacao-formatada';
import { PalpiteComJogo } from '@/types/palpite.types';
import { Fase } from '@/types/jogo.types';
import { IconPalpite } from '@/components/icons/icon-palpite';

type FiltroTipo = 'todos' | 'cheio' | 'parcial' | 'nada' | 'esquecido';

const OPCOES_FILTRO_TIPO = [
  { valor: 'todos', icone: '⚽', label: 'Todos' },
  { valor: 'cheio', icone: '🎯', label: 'Em cheio' },
  { valor: 'parcial', icone: '✓', label: 'Parcial' },
  { valor: 'nada', icone: '✗', label: 'Errou' },
  { valor: 'esquecido', icone: '💤', label: 'Esquecido' },
] as const;

function aplicarFiltroTipo(palpites: PalpiteComJogo[], filtroTipo: FiltroTipo): PalpiteComJogo[] {
  if (filtroTipo === 'todos') return palpites;
  return palpites.filter((p) => {
    const semPalpite = p.golsCasa === -1 && p.golsFora === -1;
    if (filtroTipo === 'esquecido') return semPalpite;
    if (semPalpite) return filtroTipo === 'nada';
    const pts = calcularPontos(p);
    if (filtroTipo === 'cheio') return pts === PONTOS.ACERTO_EM_CHEIO;
    if (filtroTipo === 'parcial') return pts === PONTOS.ACERTO_RESULTADO;
    return pts === 0;
  });
}

function obterLabelFiltro(filtroTipo: FiltroTipo): string {
  const opcao = OPCOES_FILTRO_TIPO.find((o) => o.valor === filtroTipo);
  return opcao ? `${opcao.icone} ${opcao.label}` : '⚽ Filtros';
}

interface PropsAbaMeusPalpites {
  palpitesFinalizados: PalpiteComJogo[];
  carregandoPalpites: boolean;
  buscandoPalpites: boolean;
  temporadaId: string;
  fases?: Fase[];
}

export function AbaMeusPalpites({
  palpitesFinalizados,
  carregandoPalpites,
  buscandoPalpites,
  temporadaId,
  fases,
}: Readonly<PropsAbaMeusPalpites>) {
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos');
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (dropdownAberto && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, [dropdownAberto]);

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
        <p className="text-texto/40 text-sm">Nenhum jogo finalizado ainda</p>
        <p className="text-texto/20 text-[10px] mt-1">
          Os resultados aparecerão aqui após os jogos finalizarem
        </p>
      </div>
    );
  }

  const listaFiltrada = aplicarFiltroTipo(palpitesFinalizados, filtroTipo);
  const listaComPalpite = palpitesFinalizados.filter((p) => !(p.golsCasa === -1 && p.golsFora === -1));
  const totalEmCheio = listaComPalpite.filter((p) => calcularPontos(p) === PONTOS.ACERTO_EM_CHEIO).length;
  const totalPontos = listaComPalpite.reduce((acc, p) => acc + calcularPontos(p), 0);
  const aproveitamento = listaComPalpite.length > 0
    ? Math.round((listaComPalpite.filter((p) => calcularPontos(p) > 0).length / listaComPalpite.length) * 100)
    : 0;

  const faseNomeMap: Record<string, string> = {};
  if (fases) {
    for (const f of fases) {
      faseNomeMap[f.id] = f.nome;
    }
  }

  return (
    <div>
      {/* Filtro de tipo */}
      <div className="flex items-center justify-end mb-3">
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setDropdownAberto(!dropdownAberto)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[11px] font-semibold transition-colors ${
              filtroTipo === 'todos' ? 'bg-white/[0.04] text-texto/60 border-white/[0.12]' : 'bg-primaria/10 text-primaria-claro border-primaria/50'
            }`}
          >
            {obterLabelFiltro(filtroTipo)}
          </button>
          {dropdownAberto && (
            <div className="absolute z-20 top-full mt-1 right-0 w-36 rounded-xl border border-white/[0.12] bg-[#0d1a2d] shadow-[0_8px_32px_rgba(0,0,0,0.5)] p-1.5">
              {OPCOES_FILTRO_TIPO.map((item) => (
                <button
                  key={item.valor}
                  type="button"
                  onClick={() => { setFiltroTipo(item.valor); setDropdownAberto(false); }}
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

      {/* Lista flat por data decrescente */}
      <div className="space-y-2">
        {listaFiltrada.map((p: PalpiteComJogo) => (
          <CardPalpiteHistorico key={p.id} palpite={p} faseNomeMap={faseNomeMap} />
        ))}
      </div>

      {/* Resumo fixo */}
      <ResumoPalpites totalEmCheio={totalEmCheio} totalPontos={totalPontos} aproveitamento={aproveitamento} />
    </div>
  );
}

// --- Sub-componentes ---

function CardPalpiteHistorico({ palpite: p, faseNomeMap }: Readonly<{ palpite: PalpiteComJogo; faseNomeMap: Record<string, string> }>) {
  const semPalpite = p.golsCasa === -1 && p.golsFora === -1;
  const pts = semPalpite ? 0 : calcularPontos(p);
  const temPontos = pts > 0;

  const classeCard = (() => {
    if (semPalpite) return 'bg-red-500/[0.04] border-red-500/30';
    if (temPontos) return 'bg-white/[0.04] border-primaria/40 shadow-[0_0_12px_rgba(34,197,94,0.15)]';
    return 'bg-white/[0.04] border-white/[0.12]';
  })();

  const faseNome = p.jogo?.faseId ? faseNomeMap[p.jogo.faseId] : null;
  const dataFormatada = p.jogo?.dataHora
    ? new Date(p.jogo.dataHora).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' })
    : null;
  const infoFase = (() => {
    if (!faseNome) return dataFormatada;
    const ehMataMata = !faseNome.toLowerCase().includes('grupo');
    const rodadaLabel = !ehMataMata && p.jogo?.rodada ? `R${p.jogo.rodada}` : '';
    const faseComRodada = rodadaLabel ? `${faseNome} · ${rodadaLabel}` : faseNome;
    const partes = [dataFormatada, faseComRodada].filter(Boolean);
    return partes.join(' · ');
  })();

  return (
    <div className={`rounded-2xl border p-3 relative overflow-hidden backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.3)] ${classeCard}`}>
      {temPontos && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl bg-gradient-to-b from-primaria via-primaria-claro to-primaria/30 shadow-[0_0_14px_rgba(34,197,94,0.6)]" />
      )}
      {semPalpite && (
        <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl bg-gradient-to-b from-red-500 via-red-400 to-red-500/30" />
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
          {infoFase && (
            <span className="text-[9px] text-texto/40 mb-1 text-center leading-tight">{infoFase}</span>
          )}
          <span className="text-[11px] text-texto/80 uppercase tracking-wide mb-1.5">Placar final</span>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-texto">{p.jogo?.golsCasa ?? 0}</span>
            <span className="text-sm font-bold text-texto/40">x</span>
            <span className="text-2xl font-bold text-texto">{p.jogo?.golsFora ?? 0}</span>
          </div>
          {p.jogo?.temPenaltis && p.jogo.penaltisCasa != null && p.jogo.penaltisFora != null && (
            <span className="text-[9px] text-texto/40 mt-0.5">({p.jogo.penaltisCasa} × {p.jogo.penaltisFora} pen.)</span>
          )}
          <div className="flex items-center gap-1.5 mt-1.5">
            {semPalpite ? (
              <span className="text-[11px] font-semibold text-red-400/80">Sem palpite</span>
            ) : (
              <>
                <span className="text-[9px] text-texto/40">Palpite:</span>
                <span className="text-[11px] font-semibold text-primaria-claro">{p.golsCasa} × {p.golsFora}</span>
              </>
            )}
          </div>
          <div className="mt-1.5">
            <PontuacaoLabel semPalpite={semPalpite} temPontos={temPontos} pts={pts} />
          </div>
        </div>
        <EscudoTimePequeno time={p.jogo?.timeFora} label="Fora" />
      </div>
    </div>
  );
}

function PontuacaoLabel({ semPalpite, temPontos, pts }: Readonly<{ semPalpite: boolean; temPontos: boolean; pts: number }>) {
  if (semPalpite) {
    return <span className="text-[10px] text-red-400/60">0 pts</span>;
  }
  if (temPontos) {
    const icone = pts === PONTOS.ACERTO_EM_CHEIO ? '🎯' : '✓';
    return <span className="text-[10px] text-primaria font-semibold flex items-center gap-1">{formatarPontuacao(pts)} {icone}</span>;
  }
  return <span className="text-[10px] text-texto/30">{formatarPontuacao(0)}</span>;
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
