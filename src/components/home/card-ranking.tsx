'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Crown, Target, Zap, Clock, CircleDot, CircleOff, ChevronDown, ChevronRight, Check } from 'lucide-react';

interface EntradaRanking {
  posicao: number;
  nome: string;
  pontos: number;
  acertosEmCheio: number;
  acertosDeResultado: number;
  totalPalpites: number;
  esquecidos: number;
  destaque?: boolean;
}

interface GrupoOpcao {
  id: string;
  nome: string;
}

interface PropsCardRanking {
  ranking: EntradaRanking[];
  grupos: GrupoOpcao[];
  grupoSelecionadoId?: string;
  onTrocarGrupo: (grupoId: string) => void;
  carregando?: boolean;
  temaCopa?: boolean;
  ocultarBotaoCompleto?: boolean;
  mostrarTodos?: boolean;
  filtroRodada?: {
    ativo: boolean;
    rodadaSelecionada: number | null;
    rodadaMax: number;
    onTrocarFiltro: (tipo: 'geral' | 'rodada') => void;
    onTrocarRodada: (rodada: number) => void;
    rankingRodada?: EntradaRanking[];
    filtroAtivo: 'geral' | 'rodada';
  };
}

function obterIniciais(nome: string): string {
  return nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
}

function corPontos(entrada: EntradaRanking): string {
  if (entrada.destaque) return 'text-primaria-claro';
  if (entrada.posicao === 1) return 'text-yellow-400';
  return 'text-texto/50';
}

function corPosicao(indice: number): string {
  if (indice === 1) return 'text-yellow-400';
  if (indice === 0) return 'text-gray-300';
  return 'text-orange-400';
}

/**
 * Ordena ranking:
 * 1. Pontuação (desc)
 * 2. Acertos em cheio (desc)
 * 3. Acertos parciais (desc)
 * 4. Total de palpites feitos (desc)
 * Se todos com 0 pontos → mantém ordem original (sem distinção)
 */
function ordenarRanking(ranking: EntradaRanking[]): EntradaRanking[] {
  const alguemPontuou = ranking.some((e) => e.pontos > 0);
  if (!alguemPontuou) return ranking;

  return [...ranking].sort((a, b) => {
    if (b.pontos !== a.pontos) return b.pontos - a.pontos;
    if (b.acertosEmCheio !== a.acertosEmCheio) return b.acertosEmCheio - a.acertosEmCheio;
    if (b.acertosDeResultado !== a.acertosDeResultado) return b.acertosDeResultado - a.acertosDeResultado;
    return b.totalPalpites - a.totalPalpites;
  });
}

function atribuirPosicoes(ranking: EntradaRanking[]): EntradaRanking[] {
  return ranking.map((entry, i) => ({ ...entry, posicao: i + 1 }));
}

/** Pódio visual: top 3 (2º | 1º | 3º) */
function Podio({ top3 }: Readonly<{ top3: EntradaRanking[] }>) {
  if (top3.length < 3) return null;

  const ordem = [top3[1], top3[0], top3[2]];
  const alturas = ['h-16', 'h-20', 'h-14'];
  const bordas = [
    'border-gray-400/80',
    'border-yellow-400/90 shadow-[0_0_16px_rgba(234,179,8,0.35)]',
    'border-orange-500/80',
  ];
  const bgColors = ['bg-transparent', 'bg-transparent', 'bg-transparent'];
  const posicoes = [2, 1, 3];

  const glowColors = [
    'bg-gray-400/20 blur-md',
    'bg-yellow-400/25 blur-lg',
    'bg-orange-500/20 blur-md',
  ];

  const bordaTopColors = [
    'border-t-gray-400/80',
    'border-t-yellow-400/90',
    'border-t-orange-500/80',
  ];

  return (
    <div className="flex items-end justify-center gap-3 mb-3 pt-2">
      {ordem.map((entrada, i) => (
        <div key={`podio-${i}-${entrada.nome}`} className="flex flex-col items-center gap-1">
          {i === 1 && <Crown size={18} className="text-yellow-400 mb-0.5" />}

          {/* Avatar com glow */}
          <div className="relative">
            <div className={`absolute inset-0 rounded-full ${glowColors[i]}`} />
            <div
              className={`relative flex items-center justify-center rounded-full text-[10px] font-bold border-2 ${bordas[i]} ${bgColors[i]} ${
                entrada.destaque ? 'ring-2 ring-primaria/30' : ''
              } ${i === 1 ? 'h-12 w-12' : 'h-10 w-10'}`}
            >
              {obterIniciais(entrada.nome)}
            </div>
          </div>

          <span
            className={`text-[10px] font-medium text-center max-w-[60px] truncate ${
              entrada.destaque ? 'text-primaria-claro' : 'text-texto/60'
            }`}
          >
            {entrada.nome.split(' ')[0]}
          </span>

          <div className="relative">
            <div className={`absolute inset-0 rounded-t-lg ${glowColors[i]}`} />
            <div
              className={`relative ${alturas[i]} w-14 rounded-t-lg ${bgColors[i]} border-t-2 ${bordaTopColors[i]} border-x border-x-white/[0.06] border-b-0 flex flex-col items-center justify-center gap-0.5 backdrop-blur-sm`}
            >
              <span className={`text-[11px] font-black ${corPosicao(i)}`}>
                {posicoes[i]}º
              </span>
              <span className={`text-[9px] font-bold ${corPontos(entrada)}`}>
                {entrada.pontos} pts
              </span>
              {/* Stats compactos */}
              <div className="flex items-center justify-center gap-2 mt-0.5">
                <span className="inline-flex items-center gap-0.5 text-[8px] text-sucesso/70 leading-none">
                  <Target size={8} className="shrink-0" />{entrada.acertosEmCheio}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[8px] text-destaque/70 leading-none">
                  <Zap size={8} className="shrink-0" />{entrada.acertosDeResultado}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Dropdown customizado para filtro de grupo */
function FiltroGrupoDropdown({
  grupos,
  grupoSelecionadoId,
  onTrocarGrupo,
}: Readonly<{
  grupos: GrupoOpcao[];
  grupoSelecionadoId?: string;
  onTrocarGrupo: (grupoId: string) => void;
}>) {
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const grupoAtivo = grupos.find((g) => g.id === grupoSelecionadoId);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    if (aberto) {
      document.addEventListener('mousedown', handleClickFora);
    }
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, [aberto]);

  return (
    <div className="relative ml-1.5" ref={ref}>
      {/* Trigger */}
      <button
        onClick={() => setAberto(!aberto)}
        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.1] hover:border-primaria/30 transition-all"
        data-testid="home-ranking-filtro-grupo"
      >
        <span className="text-[10px] font-semibold text-texto/60 max-w-[80px] truncate">
          {grupoAtivo?.nome ?? 'Grupo'}
        </span>
        <ChevronDown
          size={10}
          className={`text-texto/30 transition-transform ${aberto ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Menu dropdown */}
      {aberto && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[140px] rounded-xl bg-superficie/95 backdrop-blur-xl border border-white/[0.1] shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden animate-[fadeIn_0.15s_ease-out]">
          {grupos.map((g) => {
            const selecionado = g.id === grupoSelecionadoId;
            return (
              <button
                key={g.id}
                onClick={() => {
                  onTrocarGrupo(g.id);
                  setAberto(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors ${
                  selecionado
                    ? 'bg-primaria/10 text-primaria-claro'
                    : 'text-texto/60 hover:bg-white/[0.04] hover:text-texto/80'
                }`}
              >
                <span className="text-[11px] font-medium flex-1 truncate">{g.nome}</span>
                {selecionado && <Check size={12} className="text-primaria-claro shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function CardRanking({
  ranking,
  grupos,
  grupoSelecionadoId,
  onTrocarGrupo,
  carregando,
  temaCopa,
  ocultarBotaoCompleto,
  mostrarTodos,
  filtroRodada,
}: Readonly<PropsCardRanking>) {
  const router = useRouter();

  function irParaRanking() {
    if (grupoSelecionadoId) {
      router.push(`/grupos/${grupoSelecionadoId}`);
    } else {
      router.push('/grupos');
    }
  }

  // Usar ranking da rodada se filtro ativo
  const dadosRanking = filtroRodada?.filtroAtivo === 'rodada' && filtroRodada.rankingRodada
    ? filtroRodada.rankingRodada
    : ranking;

  const rankingOrdenado = useMemo(
    () => atribuirPosicoes(ordenarRanking(dadosRanking)),
    [dadosRanking]
  );
  const limite = mostrarTodos ? rankingOrdenado.length : 8;
  const rankingLimitado = rankingOrdenado.slice(0, limite);
  const top3 = rankingLimitado.slice(0, 3);
  const resto = rankingLimitado.slice(3);
  const mostrarPodio = top3.length >= 3 && top3.some((e) => e.pontos > 0);

  const minhaEntrada = rankingOrdenado.find((e) => e.destaque);
  const lider = rankingOrdenado[0];
  const ptsAtras = lider && minhaEntrada ? lider.pontos - minhaEntrada.pontos : 0;

  const cardBorder = temaCopa
    ? 'border-[#ffdf00] shadow-[0_0_24px_rgba(255,223,0,0.3)]'
    : 'border-primaria shadow-[0_0_20px_rgba(22,163,74,0.2)]';

  const cardBg = temaCopa
    ? 'bg-gradient-to-b from-[#009c3b]/15 via-[#003d1a]/80 to-[#ffdf00]/10'
    : '';

  return (
    <Card data-testid="home-card-ranking" className={`${cardBorder} ${cardBg}`}>
      <CardContent className="p-4">
        {/* Header com filtro dropdown inline */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${temaCopa ? 'bg-[#009c3b]/20' : 'bg-primaria/15'}`}>
              <span className="text-sm">🏅</span>
            </div>
            <span className={`text-xs font-bold uppercase tracking-wider ${temaCopa ? 'text-[#ffdf00]' : 'text-texto'}`}>
              Ranking
            </span>

            {/* Dropdown de grupo — sempre ao lado do título */}
            {grupos.length > 1 && (
              <FiltroGrupoDropdown
                grupos={grupos}
                grupoSelecionadoId={grupoSelecionadoId}
                onTrocarGrupo={onTrocarGrupo}
              />
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Filtro Geral/Rodada */}
            {filtroRodada?.ativo && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => filtroRodada.onTrocarFiltro('geral')}
                  className={`text-[10px] px-2 py-1 rounded-md transition-colors ${
                    filtroRodada.filtroAtivo === 'geral'
                      ? 'bg-primaria/15 text-primaria-claro font-semibold border border-primaria/30'
                      : 'text-texto/40 border border-white/[0.08] hover:text-texto/60'
                  }`}
                >
                  Geral
                </button>
                <button
                  onClick={() => filtroRodada.onTrocarFiltro('rodada')}
                  className={`text-[10px] px-2 py-1 rounded-md transition-colors ${
                    filtroRodada.filtroAtivo === 'rodada'
                      ? 'bg-primaria/15 text-primaria-claro font-semibold border border-primaria/30'
                      : 'text-texto/40 border border-white/[0.08] hover:text-texto/60'
                  }`}
                >
                  Rodada
                </button>
              </div>
            )}

            {!ocultarBotaoCompleto && (
              <button
                onClick={irParaRanking}
                className="text-[11px] text-primaria-claro font-medium hover:text-primaria transition-colors shrink-0"
                data-testid="home-ver-ranking-completo"
              >
                Completo <ChevronRight size={14} className="inline" />
              </button>
            )}
          </div>
        </div>

        {/* Seletor de rodada */}
        {filtroRodada?.ativo && filtroRodada.filtroAtivo === 'rodada' && (
          <div className="flex items-center justify-center gap-3 py-2 mb-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <button
              type="button"
              onClick={() => filtroRodada.onTrocarRodada(Math.max(1, (filtroRodada.rodadaSelecionada ?? 1) - 1))}
              disabled={!filtroRodada.rodadaSelecionada || filtroRodada.rodadaSelecionada <= 1}
              className="h-8 w-8 rounded-full flex items-center justify-center text-primaria-claro hover:text-primaria disabled:opacity-20 transition-colors"
            >
              <ChevronRight size={20} className="rotate-180" />
            </button>
            <span className="text-[12px] text-texto/70 font-medium min-w-[100px] text-center">
              {filtroRodada.rodadaSelecionada ? `Rodada ${filtroRodada.rodadaSelecionada}` : 'Selecione'}
            </span>
            <button
              type="button"
              onClick={() => filtroRodada.onTrocarRodada(Math.min(filtroRodada.rodadaMax, (filtroRodada.rodadaSelecionada ?? 0) + 1))}
              disabled={filtroRodada.rodadaSelecionada === filtroRodada.rodadaMax}
              className="h-8 w-8 rounded-full flex items-center justify-center text-primaria-claro hover:text-primaria disabled:opacity-20 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Loading */}
        {carregando && (
          <div className="space-y-2 py-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-white/[0.03] animate-pulse" />
            ))}
          </div>
        )}

        {/* Vazio */}
        {!carregando && ranking.length === 0 && (
          <p className="text-sm text-texto/40 text-center py-4">
            Ranking disponível após os primeiros jogos
          </p>
        )}

        {/* Ranking */}
        {!carregando && ranking.length > 0 && (
          <>
            {/* Pódio (só quando alguém pontuou e há 3+) */}
            {mostrarPodio && <Podio top3={top3} />}

            {/* Lista quando sem pódio (< 3 participantes ou ninguém pontuou) */}
            {!mostrarPodio && (
              <div className="space-y-0.5">
                {rankingLimitado.map((entrada, index) => (
                  <ItemRanking key={`item-${index}-${entrada.nome}`} entrada={entrada} />
                ))}
              </div>
            )}

            {/* 4º em diante (só quando pódio visível) */}
            {mostrarPodio && resto.length > 0 && (
              <div className="space-y-0.5 border-t border-white/[0.05] pt-2">
                {resto.map((entrada, index) => (
                  <ItemRanking key={`resto-${index}-${entrada.nome}`} entrada={entrada} />
                ))}
              </div>
            )}

            {/* Minha posição se fora da lista visível */}
            {minhaEntrada && minhaEntrada.posicao > limite && (
              <div className="mt-2 pt-2 border-t border-white/[0.05]">
                <ItemRanking entrada={minhaEntrada} />
              </div>
            )}

            {/* Motivação */}
            {minhaEntrada && ptsAtras > 0 && (
              <div className="mt-3 pt-2 border-t border-white/[0.05] flex items-center gap-2">
                <TrendingUp size={14} className="text-destaque" />
                <span className="text-[11px] text-texto/50">
                  Faltam <span className="text-destaque font-bold">{ptsAtras} pts</span> para o 1º lugar!
                </span>
              </div>
            )}

            {minhaEntrada && ptsAtras === 0 && minhaEntrada.posicao === 1 && (
              <div className="mt-3 pt-2 border-t border-white/[0.05] flex items-center gap-2">
                <span className="text-sm">🔥</span>
                <span className="text-[11px] text-primaria-claro font-medium">
                  Você está na liderança! Continue assim!
                </span>
              </div>
            )}

            {/* Legenda de desempate com ícones */}
            <div className="flex items-center justify-center gap-1.5 mt-3 pt-2 border-t border-white/[0.04] text-[9px] text-texto/30">
              <span>Desempate:</span>
              <span className="flex items-center gap-0.5 text-sucesso/60">
                <Target size={9} /> cheio
              </span>
              <span className="text-texto/20">→</span>
              <span className="flex items-center gap-0.5 text-destaque/60">
                <Zap size={9} /> parcial
              </span>
              <span className="text-texto/20">→</span>
              <span className="flex items-center gap-0.5 text-texto/35">
                <Clock size={9} /> hora do palpite
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

/** Item do ranking (4º, 5º ou minha posição) com stats de palpites */
function ItemRanking({ entrada }: Readonly<{ entrada: EntradaRanking }>) {
  return (
    <div
      className={`flex items-center gap-2.5 py-3 px-2.5 rounded-xl transition-all ${
        entrada.destaque
          ? 'bg-primaria/[0.08] border border-primaria/20'
          : 'hover:bg-white/[0.02]'
      }`}
    >
      {/* Posição */}
      <span className="text-xs text-texto/50 font-bold w-5 text-center tabular-nums shrink-0">
        {entrada.posicao}º
      </span>

      {/* Avatar */}
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold shrink-0 ${
          entrada.destaque
            ? 'bg-primaria/20 text-primaria-claro border border-primaria/30'
            : 'bg-white/[0.08] text-texto/70 border border-white/[0.12]'
        }`}
      >
        {obterIniciais(entrada.nome)}
      </div>

      {/* Nome + stats detalhados */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-sm truncate ${
              entrada.destaque ? 'text-texto font-bold' : 'text-texto/90 font-medium'
            }`}
          >
            {entrada.nome}
          </span>
          {entrada.destaque && (
            <span className="text-[9px] text-primaria/60 font-medium shrink-0">você</span>
          )}
        </div>

        {/* Stats com badges visuais */}
        <div className="flex items-center gap-1.5 mt-1">
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-sucesso/10 text-[8px] font-semibold text-sucesso/80">
            <Target size={8} />
            {entrada.acertosEmCheio} cheio
          </span>
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-destaque/10 text-[8px] font-semibold text-destaque/80">
            <Zap size={8} />
            {entrada.acertosDeResultado} parcial
          </span>
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white/[0.04] text-[8px] font-medium text-texto/35">
            <CircleDot size={8} />
            {entrada.totalPalpites}
          </span>
          {entrada.esquecidos > 0 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-erro/10 text-[8px] font-semibold text-erro/60">
              <CircleOff size={8} />
              {entrada.esquecidos}
            </span>
          )}
        </div>
      </div>

      {/* Pontos — destaque grande */}
      <div className="flex flex-col items-end shrink-0">
        <span className={`text-base tabular-nums font-bold ${corPontos(entrada)}`}>
          {entrada.pontos}
        </span>
        <span className="text-[8px] text-texto/25 font-medium">pts</span>
      </div>
    </div>
  );
}
