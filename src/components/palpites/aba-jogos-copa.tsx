'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy } from 'lucide-react';
import { listarJogosFase } from '@/services/jogo.service';
import { Fase, Jogo } from '@/types/jogo.types';
import { Palpite } from '@/types/palpite.types';
import { buscarMeusPalpitesPorJogos } from '@/services/palpite.service';
import { CardJogoPalpite } from '@/components/jogos/card-jogo-palpite';
import { podePalpitar, estaBloqueado } from '@/hooks/usePalpitesData';
import { IconPalpite } from '@/components/icons/icon-palpite';

interface PropsAbaJogosCopa {
  fases: Fase[];
  grupoId: string;
  cardAtivo: string | null;
  onFoco: (jogoId: string) => void;
}

export function AbaJogosCopa({ fases, grupoId, cardAtivo, onFoco }: Readonly<PropsAbaJogosCopa>) {
  const [rodadaSelecionada, setRodadaSelecionada] = useState<number>(1);

  // Todas as fases (grupos + eliminatórias juntas, ordenadas por ordem)
  const fasesOrdenadas = [...fases].sort((a, b) => a.ordem - b.ordem);

  // Buscar jogos de TODAS as fases da rodada selecionada em paralelo
  const { data: jogosPorGrupo, isLoading: carregandoJogos } = useQuery({
    queryKey: ['jogos-copa-todos-grupos', rodadaSelecionada],
    queryFn: async () => {
      const resultados = await Promise.all(
        fasesOrdenadas.map(async (fase) => {
          try {
            const res = await listarJogosFase(fase.id, rodadaSelecionada);
            return { fase, jogos: res.jogos };
          } catch {
            return { fase, jogos: [] };
          }
        }),
      );
      return resultados.filter((r) => r.jogos.length > 0);
    },
    enabled: fasesOrdenadas.length > 0,
    staleTime: 1000 * 30,
  });

  // Coletar todos os IDs de jogos para batch de palpites
  const todosJogos = jogosPorGrupo?.flatMap((g) => g.jogos) ?? [];
  const jogoIds = todosJogos.map((j) => j.id);

  const { data: palpitesBatch } = useQuery({
    queryKey: ['palpites-copa-batch', rodadaSelecionada, jogoIds.join(',')],
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

  return (
    <div className="space-y-4">
      {/* Seletor de rodada */}
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3].map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setRodadaSelecionada(r)}
            className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${
              rodadaSelecionada === r
                ? 'bg-destaque text-white shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'bg-white/[0.04] text-texto/50 border border-white/[0.08] hover:bg-white/[0.08]'
            }`}
          >
            {r}
          </button>
        ))}
        <span className="text-[10px] text-texto/30 ml-1">ª rodada</span>
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
              <div className="sticky top-[120px] z-10 flex items-center gap-2 py-2 -mx-4 px-4 bg-fundo/95 backdrop-blur-md">
                <span className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-destaque/40 to-destaque/60 rounded-full" />
                <span className="text-[11px] text-destaque font-bold uppercase tracking-wide px-3 py-1.5 rounded-full border border-destaque/30 bg-destaque/10">
                  <Trophy size={10} className="inline mr-1 -mt-0.5" />
                  Rodada {rodadaSelecionada} — {fase.nome}
                </span>
                <span className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-destaque/40 to-destaque/60 rounded-full" />
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
