'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, ChevronLeft, ChevronRight } from 'lucide-react';
import { Fase, Jogo } from '@/types/jogo.types';
import { Palpite } from '@/types/palpite.types';
import { buscarMeusPalpitesPorJogos } from '@/services/palpite.service';
import { CardJogoPalpite } from '@/components/jogos/card-jogo-palpite';
import { podePalpitar, estaBloqueado } from '@/hooks/usePalpitesData';
import { IconPalpite } from '@/components/icons/icon-palpite';

interface PropsAbaJogosCopa {
  fases: Fase[];
  grupoId: string;
  temporadaId: string;
  cardAtivo: string | null;
  onFoco: (jogoId: string) => void;
}

export function AbaJogosCopa({ fases, grupoId, temporadaId, cardAtivo, onFoco }: Readonly<PropsAbaJogosCopa>) {
  const [rodadaSelecionada, setRodadaSelecionada] = useState<number>(1);

  // Todas as fases (grupos + eliminatórias juntas, ordenadas por ordem)
  const fasesOrdenadas = [...fases].sort((a, b) => a.ordem - b.ordem);

  // Buscar jogos de TODAS as fases da rodada selecionada — 1 request via listarJogosTemporada
  const { data: jogosPorGrupo, isLoading: carregandoJogos } = useQuery({
    queryKey: ['jogos-copa-todos-grupos', temporadaId, rodadaSelecionada],
    queryFn: async () => {
      const { listarJogosTemporada } = await import('@/services/jogo.service');
      const todosJogos = await listarJogosTemporada(temporadaId);
      // Filtrar pela rodada selecionada e agrupar por fase
      return fasesOrdenadas
        .map((fase) => ({
          fase,
          jogos: todosJogos.filter((j) => j.faseId === fase.id && j.rodada === rodadaSelecionada),
        }))
        .filter((r) => r.jogos.length > 0);
    },
    enabled: fasesOrdenadas.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  // Coletar todos os IDs de jogos para batch de palpites
  const todosJogos = jogosPorGrupo?.flatMap((g) => g.jogos) ?? [];
  const jogoIds = todosJogos.map((j) => j.id);

  const { data: palpitesBatch } = useQuery({
    queryKey: ['palpites-copa-batch', temporadaId, rodadaSelecionada],
    queryFn: async () => {
      const palpites = await buscarMeusPalpitesPorJogos(jogoIds);
      const map: Record<string, Palpite> = {};
      for (const p of palpites) {
        map[p.jogoId] = p;
      }
      return map;
    },
    enabled: jogoIds.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const palpitesPorJogo = palpitesBatch ?? {};

  // Contar palpites feitos vs total de jogos palpitáveis
  const jogosPalpitaveis = todosJogos.filter((j) => podePalpitar(j));
  const totalPalpitaveis = jogosPalpitaveis.length;
  const palpitesFeitos = jogosPalpitaveis.filter((j) => !!palpitesPorJogo[j.id]).length;

  return (
    <div className="space-y-4">
      {/* Header: RODADA + barra de progresso + contador */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setRodadaSelecionada(Math.max(1, rodadaSelecionada - 1))}
          disabled={rodadaSelecionada <= 1}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#009c3b]/30 text-[#a8e6b0]/60 hover:text-[#ffdf00] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          aria-label="Rodada anterior"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-[#ffdf00] uppercase tracking-wide">
              Rodada {rodadaSelecionada}
            </span>
            <span className="text-[11px] text-[#009c3b] font-semibold">
              {palpitesFeitos}/{totalPalpitaveis} palpites feitos
            </span>
          </div>
          {/* Barra de progresso */}
          <div className="flex gap-[2px] h-2">
            {jogosPalpitaveis.map((jogo) => (
              <div
                key={jogo.id}
                className={`flex-1 rounded-sm transition-colors ${
                  palpitesPorJogo[jogo.id] ? 'bg-[#009c3b]' : 'bg-white/[0.12]'
                }`}
              />
            ))}
            {totalPalpitaveis === 0 && (
              <div className="flex-1 rounded-sm bg-white/[0.06]" />
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setRodadaSelecionada(Math.min(3, rodadaSelecionada + 1))}
          disabled={rodadaSelecionada >= 3}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-[#009c3b]/30 text-[#a8e6b0]/60 hover:text-[#ffdf00] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          aria-label="Próxima rodada"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Seletor de rodada */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRodadaSelecionada(r)}
            className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all ${
              rodadaSelecionada === r
                ? 'bg-[#009c3b]/30 text-[#ffdf00] border border-[#009c3b]/50 shadow-[0_0_12px_rgba(0,156,59,0.3)]'
                : 'bg-[#009c3b]/[0.06] text-[#a8e6b0]/60 border border-[#009c3b]/20 hover:bg-[#009c3b]/15 hover:text-[#ffdf00]/80'
            }`}
          >
            Rodada {r}
          </button>
        ))}
      </div>

      {/* Loading */}
      {carregandoJogos && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[140px] rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
          ))}
        </div>
      )}

      {/* Jogos agrupados por fase */}
      {!carregandoJogos && jogosPorGrupo && jogosPorGrupo.length > 0 && (
        <div className="space-y-5">
          {jogosPorGrupo.map(({ fase, jogos }) => (
            <div key={fase.id}>
              {/* Separador: Rodada X — Grupo Y */}
              <div className="sticky top-[88px] z-10 flex items-center gap-2 py-2 -mx-4 px-4 bg-[#003d1a]/95 backdrop-blur-md">
                <span className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-[#ffdf00]/40 to-[#ffdf00]/60 rounded-full" />
                <span className="text-[11px] text-[#ffdf00] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full border border-[#ffdf00]/30 bg-[#ffdf00]/10">
                  <Trophy size={10} className="inline mr-1 -mt-0.5" />
                  Rodada {rodadaSelecionada} — {fase.nome}
                </span>
                <span className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-[#ffdf00]/40 to-[#ffdf00]/60 rounded-full" />
              </div>

              {/* Cards de jogos */}
              <div className="space-y-2 mt-2">
                {jogos.map((jogo: Jogo) => (
                  <CardJogoPalpite
                    key={jogo.id}
                    jogo={jogo}
                    palpiteInicial={palpitesPorJogo[jogo.id] ?? null}
                    palpitavel={podePalpitar(jogo)}
                    bloqueado={estaBloqueado(jogo)}
                    grupoId={grupoId}
                    ativo={cardAtivo === jogo.id}
                    onFoco={() => onFoco(jogo.id)}
                    temaCopa
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado vazio */}
      {!carregandoJogos && (!jogosPorGrupo || jogosPorGrupo.length === 0) && (
        <div className="flex flex-col items-center py-12 text-center">
          <IconPalpite size={32} className="text-texto/15 mb-3" />
          <p className="text-texto/40 text-sm">Nenhum jogo nesta rodada</p>
        </div>
      )}
    </div>
  );
}
