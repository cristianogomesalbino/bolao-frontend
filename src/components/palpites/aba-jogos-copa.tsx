'use client';

import { useState, useEffect, useMemo } from 'react';
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

/** Verifica se um jogo de mata-mata tem os dois times definidos (não são placeholders) */
function temTimesDefinidos(jogo: Jogo): boolean {
  const ehPlaceholder = (nome?: string, sigla?: string) => {
    if (!nome || !sigla) return true;
    if (sigla === 'TBD') return true;
    if (/^\d[ºo°]\s/.test(nome)) return true;
    if (/^[A-Z]{2,}\s[A-L]{3,}/i.test(nome)) return true;
    return false;
  };
  return !ehPlaceholder(jogo.timeCasa?.nome, jogo.timeCasa?.sigla) &&
         !ehPlaceholder(jogo.timeFora?.nome, jogo.timeFora?.sigla);
}

/** Chaveamento dos 16 avos — posição de cada time por rodada */
const CHAVEAMENTO_16AVOS: Record<number, { casa: string; fora: string }> = {
  1: { casa: '2ºA', fora: '2ºB' },
  2: { casa: '1ºC', fora: '2ºF' },
  3: { casa: '1ºE', fora: '3º ABCDF' },
  4: { casa: '1ºF', fora: '2ºC' },
  5: { casa: '2ºE', fora: '2ºI' },
  6: { casa: '1ºI', fora: '3º CDFGH' },
  7: { casa: '1ºA', fora: '3º CEFHI' },
  8: { casa: '1ºL', fora: '3º EHIJK' },
  9: { casa: '1ºG', fora: '3º AEHIJ' },
  10: { casa: '1ºD', fora: '3º BEFIJ' },
  11: { casa: '1ºH', fora: '2ºJ' },
  12: { casa: '2ºK', fora: '2ºL' },
  13: { casa: '1ºB', fora: '3º EFGIJ' },
  14: { casa: '2ºD', fora: '2ºG' },
  15: { casa: '1ºJ', fora: '2ºH' },
  16: { casa: '1ºK', fora: '3º DEIJL' },
};

/** Retorna o label de posição do chaveamento quando o time é TBD */
function obterLabelPosicao(jogo: Jogo, lado: 'casa' | 'fora'): string | null {
  const sigla = lado === 'casa' ? jogo.timeCasa?.sigla : jogo.timeFora?.sigla;
  if (sigla !== 'TBD') return null;
  if (!jogo.rodada) return null;

  const regra = CHAVEAMENTO_16AVOS[jogo.rodada];
  if (!regra) return null;

  return lado === 'casa' ? regra.casa : regra.fora;
}

/** Substitui a sigla/nome "TBD" pela posição do chaveamento (ex: "1ºF") */
function substituirSiglaTBD(jogo: Jogo): Jogo {
  const labelCasa = obterLabelPosicao(jogo, 'casa');
  const labelFora = obterLabelPosicao(jogo, 'fora');

  if (!labelCasa && !labelFora) return jogo;

  return {
    ...jogo,
    timeCasa: labelCasa
      ? { ...jogo.timeCasa!, sigla: labelCasa, nome: 'A definir' }
      : jogo.timeCasa,
    timeFora: labelFora
      ? { ...jogo.timeFora!, sigla: labelFora, nome: 'A definir' }
      : jogo.timeFora,
  };
}

function obterClasseFasePill(ativa: boolean, semJogos: boolean): string {
  if (ativa) return 'bg-[#009c3b]/30 text-[#ffdf00] border border-[#009c3b]/50 shadow-[0_0_12px_rgba(0,156,59,0.3)]';
  if (semJogos) return 'bg-white/[0.02] text-[#a8e6b0]/30 border border-white/[0.04] cursor-not-allowed';
  return 'bg-[#009c3b]/[0.06] text-[#a8e6b0]/60 border border-[#009c3b]/20 hover:bg-[#009c3b]/15 hover:text-[#ffdf00]/80';
}

/** Determina as fases ativas para exibição */
function calcularFasesAtivas(
  fases: Fase[],
  jogosPorFase: Map<string, Jogo[]>,
): Fase[] {
  const fasesOrdenadas = [...fases].sort((a, b) => a.ordem - b.ordem);
  const fasesGrupos = fasesOrdenadas.filter((f) => f.tipo === 'PONTOS_CORRIDOS');
  const fasesEliminatorias = fasesOrdenadas.filter((f) => f.tipo === 'MATA_MATA');

  const ativas: Fase[] = [];

  adicionarFaseGruposSePendente(fasesGrupos, jogosPorFase, ativas);
  adicionarEliminatoriasComJogos(fasesEliminatorias, jogosPorFase, ativas);
  adicionarProximaEliminatoriaEmBreve(fasesEliminatorias, jogosPorFase, ativas);

  return ativas;
}

function adicionarFaseGruposSePendente(
  fasesGrupos: Fase[],
  jogosPorFase: Map<string, Jogo[]>,
  ativas: Fase[],
): void {
  const gruposTemJogosAtivos = fasesGrupos.some((fase) => {
    const jogos = jogosPorFase.get(fase.id) ?? [];
    return jogos.some((j) => j.status !== 'FINALIZADO' && j.status !== 'CANCELADO');
  });

  if (!gruposTemJogosAtivos) return;

  const primeiroGrupo = fasesGrupos[0];
  if (!primeiroGrupo) return;

  ativas.push({ ...primeiroGrupo, nome: 'Fase de Grupos' });
}

function adicionarEliminatoriasComJogos(
  fasesEliminatorias: Fase[],
  jogosPorFase: Map<string, Jogo[]>,
  ativas: Fase[],
): void {
  for (const fase of fasesEliminatorias) {
    const jogos = jogosPorFase.get(fase.id) ?? [];
    if (jogos.length > 0) {
      ativas.push(fase);
    }
  }
}

function adicionarProximaEliminatoriaEmBreve(
  fasesEliminatorias: Fase[],
  jogosPorFase: Map<string, Jogo[]>,
  ativas: Fase[],
): void {
  if (fasesEliminatorias.length === 0) return;

  const ultimaComJogos = fasesEliminatorias.findLast((f) => (jogosPorFase.get(f.id) ?? []).length > 0);
  if (!ultimaComJogos) return;

  const idxUltima = fasesEliminatorias.indexOf(ultimaComJogos);
  const jogosUltima = jogosPorFase.get(ultimaComJogos.id) ?? [];
  const temFinalizadoNaUltima = jogosUltima.some((j) => j.status === 'FINALIZADO');

  if (!temFinalizadoNaUltima || idxUltima >= fasesEliminatorias.length - 1) return;

  const proximaFase = fasesEliminatorias[idxUltima + 1];
  if (!proximaFase || ativas.includes(proximaFase)) return;

  ativas.push(proximaFase);
}

export function AbaJogosCopa({ fases, grupoId, temporadaId, cardAtivo, onFoco }: Readonly<PropsAbaJogosCopa>) {
  const [faseSelecionadaId, setFaseSelecionadaId] = useState<string | null>(null);
  const [rodadaSelecionada, setRodadaSelecionada] = useState<number | null>(null);

  const fasesOrdenadas = useMemo(() => [...fases].sort((a, b) => a.ordem - b.ordem), [fases]);
  const fasesGrupos = useMemo(() => fasesOrdenadas.filter((f) => f.tipo === 'PONTOS_CORRIDOS'), [fasesOrdenadas]);

  // Buscar todos os jogos da temporada (1 request)
  const { data: todosJogosTemporada, isLoading: carregandoJogos } = useQuery({
    queryKey: ['jogos-copa-todos', temporadaId],
    queryFn: async () => {
      const { listarJogosTemporada } = await import('@/services/jogo.service');
      return listarJogosTemporada(temporadaId);
    },
    enabled: fasesOrdenadas.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  // Agrupar jogos por faseId
  const jogosPorFase = useMemo(() => {
    const mapa = new Map<string, Jogo[]>();
    if (!todosJogosTemporada) return mapa;
    for (const jogo of todosJogosTemporada) {
      const lista = mapa.get(jogo.faseId) ?? [];
      lista.push(jogo);
      mapa.set(jogo.faseId, lista);
    }
    return mapa;
  }, [todosJogosTemporada]);

  // Calcular fases ativas
  const fasesAtivas = useMemo(
    () => calcularFasesAtivas(fases, jogosPorFase),
    [fases, jogosPorFase],
  );

  // Auto-selecionar fase ativa mais relevante
  useEffect(() => {
    if (faseSelecionadaId || fasesAtivas.length === 0 || !todosJogosTemporada) return;

    // Prioridade: primeira fase com jogos palpitáveis (AGENDADO futuro)
    for (const fase of fasesAtivas) {
      const ehGrupos = fase.nome === 'Fase de Grupos';
      const fasesIds = ehGrupos ? fasesGrupos.map((f) => f.id) : [fase.id];
      const jogos = todosJogosTemporada.filter((j) => fasesIds.includes(j.faseId));
      const temPalpitavel = jogos.some((j) => podePalpitar(j));
      if (temPalpitavel) {
        setFaseSelecionadaId(fase.id);
        return;
      }
    }

    // Fallback: última fase ativa
    setFaseSelecionadaId(fasesAtivas.at(-1)?.id ?? null);
  }, [fasesAtivas, faseSelecionadaId, todosJogosTemporada, fasesGrupos]);

  const faseSelecionada = fasesAtivas.find((f) => f.id === faseSelecionadaId) ?? null;
  const ehFaseGrupos = faseSelecionada?.nome === 'Fase de Grupos';

  // --- Lógica de Grupos (por rodada) ---
  const rodadaAtualGrupos = useMemo(() => {
    if (!ehFaseGrupos || !todosJogosTemporada) return null;
    const jogosGrupos = todosJogosTemporada.filter((j) => fasesGrupos.some((f) => f.id === j.faseId));
    const rodadas = [...new Set(jogosGrupos.map((j) => j.rodada).filter(Boolean))] as number[];
    rodadas.sort((a, b) => a - b);
    return rodadas.find((r) => jogosGrupos.some((j) => j.rodada === r && j.status !== 'FINALIZADO')) ?? rodadas.at(-1) ?? 1;
  }, [ehFaseGrupos, todosJogosTemporada, fasesGrupos]);

  // Auto-selecionar rodada atual ao entrar nos grupos
  useEffect(() => {
    if (ehFaseGrupos && rodadaAtualGrupos && rodadaSelecionada === null) {
      setRodadaSelecionada(rodadaAtualGrupos);
    }
  }, [ehFaseGrupos, rodadaAtualGrupos, rodadaSelecionada]);

  // Jogos visíveis baseado na fase selecionada
  const jogosVisiveis = useMemo(() => {
    if (!todosJogosTemporada || !faseSelecionada) return [];

    if (ehFaseGrupos) {
      // Grupos: filtrar por rodada selecionada, excluir finalizados
      const rodada = rodadaSelecionada ?? rodadaAtualGrupos ?? 1;
      return todosJogosTemporada
        .filter((j) => fasesGrupos.some((f) => f.id === j.faseId) && j.rodada === rodada)
        .filter((j) => j.status !== 'FINALIZADO')
        .sort((a, b) => {
          const dataA = a.dataHora ? new Date(a.dataHora).getTime() : Infinity;
          const dataB = b.dataHora ? new Date(b.dataHora).getTime() : Infinity;
          return dataA - dataB;
        });
    }

    // Eliminatórias: todos os jogos da fase (sem filtro de rodada)
    return todosJogosTemporada
      .filter((j) => j.faseId === faseSelecionada.id)
      .sort((a, b) => {
        const dataA = a.dataHora ? new Date(a.dataHora).getTime() : Infinity;
        const dataB = b.dataHora ? new Date(b.dataHora).getTime() : Infinity;
        return dataA - dataB;
      });
  }, [todosJogosTemporada, faseSelecionada, ehFaseGrupos, rodadaSelecionada, rodadaAtualGrupos, fasesGrupos]);

  // Agrupar jogos por grupo/fase (para separadores visuais)
  const jogosPorGrupoVisual = useMemo(() => {
    if (jogosVisiveis.length === 0) return [];

    if (ehFaseGrupos) {
      return fasesGrupos
        .map((fase) => ({
          fase,
          jogos: jogosVisiveis.filter((j) => j.faseId === fase.id),
        }))
        .filter((g) => g.jogos.length > 0);
    }

    // Eliminatórias: um único grupo
    return [{ fase: faseSelecionada!, jogos: jogosVisiveis }];
  }, [jogosVisiveis, ehFaseGrupos, fasesGrupos, faseSelecionada]);

  // IDs para batch de palpites — inclui TODOS os jogos da rodada/fase (não exclui finalizados)
  const todosJogosDaSelecao = useMemo(() => {
    if (!todosJogosTemporada || !faseSelecionada) return [];

    if (ehFaseGrupos) {
      const rodada = rodadaSelecionada ?? rodadaAtualGrupos ?? 1;
      return todosJogosTemporada.filter(
        (j) => fasesGrupos.some((f) => f.id === j.faseId) && j.rodada === rodada,
      );
    }

    return todosJogosTemporada.filter((j) => j.faseId === faseSelecionada.id);
  }, [todosJogosTemporada, faseSelecionada, ehFaseGrupos, rodadaSelecionada, rodadaAtualGrupos, fasesGrupos]);

  const jogoIdsTodos = useMemo(() => todosJogosDaSelecao.map((j) => j.id), [todosJogosDaSelecao]);

  const { data: palpitesBatch } = useQuery({
    queryKey: ['palpites-copa-batch', temporadaId, faseSelecionadaId, rodadaSelecionada],
    queryFn: async () => {
      const palpites = await buscarMeusPalpitesPorJogos(jogoIdsTodos);
      const map: Record<string, Palpite> = {};
      for (const p of palpites) {
        map[p.jogoId] = p;
      }
      return map;
    },
    enabled: jogoIdsTodos.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const palpitesPorJogo = palpitesBatch ?? {};

  // Navegação sequencial entre cards palpitáveis
  const todosJogosPalpitaveis = jogosVisiveis.filter((j) => {
    if (!podePalpitar(j)) return false;
    if (!ehFaseGrupos && !temTimesDefinidos(j)) return false;
    return true;
  });

  function proximoCardId(jogoAtualId: string): string | undefined {
    const idx = todosJogosPalpitaveis.findIndex((j) => j.id === jogoAtualId);
    if (idx >= 0 && idx < todosJogosPalpitaveis.length - 1) {
      return todosJogosPalpitaveis[idx + 1].id;
    }
    return undefined;
  }

  function ehUltimoPalpitavel(jogoId: string): boolean {
    return todosJogosPalpitaveis.at(-1)?.id === jogoId;
  }

  // Contadores de progresso — baseados em TODOS os jogos (não só visíveis)
  const palpitesFeitos = jogoIdsTodos.filter((id) => !!palpitesPorJogo[id]).length;
  const totalJogos = todosJogosDaSelecao.length;

  // --- Render ---

  // Skeleton enquanto carrega
  if (carregandoJogos) {
    return (
      <div className="space-y-4">
        {/* Skeleton do seletor de fases */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 w-28 rounded-lg bg-white/[0.04] border border-white/[0.08] animate-pulse shrink-0" />
          ))}
        </div>
        {/* Skeleton dos cards */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[140px] rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Seletor de fases (pills horizontais com scroll) */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1">
        {fasesAtivas.map((fase) => {
          const ativa = faseSelecionadaId === fase.id;
          const jogos = fase.nome === 'Fase de Grupos'
            ? todosJogosTemporada?.filter((j) => fasesGrupos.some((f) => f.id === j.faseId)) ?? []
            : jogosPorFase.get(fase.id) ?? [];
          const semJogos = jogos.length === 0;

          return (
            <button
              key={fase.id}
              type="button"
              onClick={() => {
                setFaseSelecionadaId(fase.id);
                setRodadaSelecionada(null);
              }}
              disabled={semJogos}
              className={`shrink-0 py-2 px-3.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${obterClasseFasePill(ativa, semJogos)}`}
            >
              {fase.nome}
              {semJogos && ' (em breve)'}
            </button>
          );
        })}
      </div>

      {/* Navegação por rodada (só para fase de grupos) */}
      {ehFaseGrupos && rodadaSelecionada !== null && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setRodadaSelecionada(Math.max(1, (rodadaSelecionada ?? 1) - 1))}
            disabled={(rodadaSelecionada ?? 1) <= 1}
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
                {palpitesFeitos}/{totalJogos} palpites
              </span>
            </div>
            <div className="flex gap-[2px] h-2">
              {jogoIdsTodos.map((jogoId) => (
                <div
                  key={jogoId}
                  className={`flex-1 rounded-sm transition-colors ${
                    palpitesPorJogo[jogoId] ? 'bg-[#009c3b]' : 'bg-white/[0.12]'
                  }`}
                />
              ))}
              {totalJogos === 0 && <div className="flex-1 rounded-sm bg-white/[0.06]" />}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setRodadaSelecionada(Math.min(3, (rodadaSelecionada ?? 1) + 1))}
            disabled={(rodadaSelecionada ?? 1) >= 3}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#009c3b]/30 text-[#a8e6b0]/60 hover:text-[#ffdf00] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            aria-label="Próxima rodada"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Header de progresso para eliminatórias */}
      {!ehFaseGrupos && totalJogos > 0 && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-[#ffdf00] uppercase tracking-wide">
              {faseSelecionada?.nome}
            </span>
            <span className="text-[11px] text-[#009c3b] font-semibold">
              {palpitesFeitos}/{totalJogos} palpites
            </span>
          </div>
          <div className="flex gap-[2px] h-2">
            {jogoIdsTodos.map((jogoId) => (
              <div
                key={jogoId}
                className={`flex-1 rounded-sm transition-colors ${
                  palpitesPorJogo[jogoId] ? 'bg-[#009c3b]' : 'bg-white/[0.12]'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Jogos agrupados */}
      {jogosPorGrupoVisual.length > 0 && (
        <div className="space-y-5">
          {jogosPorGrupoVisual.map(({ fase, jogos }) => (
            <div key={fase.id}>
              {/* Separador visual */}
              {ehFaseGrupos && (
                <div className="sticky top-[88px] z-10 flex items-center gap-2 py-2 -mx-4 px-4 bg-[#003d1a]/95 backdrop-blur-md">
                  <span className="h-[2px] flex-1 bg-gradient-to-r from-transparent via-[#ffdf00]/40 to-[#ffdf00]/60 rounded-full" />
                  <span className="text-[11px] text-[#ffdf00] font-bold uppercase tracking-wide px-3 py-1.5 rounded-full border border-[#ffdf00]/30 bg-[#ffdf00]/10">
                    <Trophy size={10} className="inline mr-1 -mt-0.5" />
                    {fase.nome}
                  </span>
                  <span className="h-[2px] flex-1 bg-gradient-to-l from-transparent via-[#ffdf00]/40 to-[#ffdf00]/60 rounded-full" />
                </div>
              )}

              {/* Cards de jogos */}
              <div className="space-y-2 mt-2">
                {jogos.map((jogo: Jogo) => {
                  const timesDefinidos = temTimesDefinidos(jogo);
                  const palpitavelReal = ehFaseGrupos
                    ? podePalpitar(jogo)
                    : podePalpitar(jogo) && timesDefinidos;
                  const bloqueadoReal = ehFaseGrupos
                    ? estaBloqueado(jogo)
                    : estaBloqueado(jogo) || !timesDefinidos;

                  return (
                    <div key={jogo.id}>
                      <CardJogoPalpite
                        jogo={substituirSiglaTBD(jogo)}
                        palpiteInicial={palpitesPorJogo[jogo.id] ?? null}
                        palpitavel={palpitavelReal}
                        bloqueado={bloqueadoReal}
                        grupoId={grupoId}
                        ativo={cardAtivo === jogo.id}
                        onFoco={() => onFoco(jogo.id)}
                        onProximoCard={() => {
                          const proximo = proximoCardId(jogo.id);
                          if (proximo) onFoco(proximo);
                        }}
                        ehUltimoCard={ehUltimoPalpitavel(jogo.id)}
                        temaCopa
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado vazio */}
      {!carregandoJogos && jogosPorGrupoVisual.length === 0 && (
        <div className="flex flex-col items-center py-12 text-center">
          <IconPalpite size={32} className="text-texto/15 mb-3" />
          <p className="text-texto/40 text-sm">
            {faseSelecionada && (jogosPorFase.get(faseSelecionada.id) ?? []).length === 0
              ? 'Jogos ainda não definidos para esta fase'
              : 'Todos os jogos desta rodada já foram finalizados'}
          </p>
          <p className="text-texto/20 text-[10px] mt-1">Confira a aba &ldquo;Meus palpites&rdquo; para ver seus resultados</p>
        </div>
      )}
    </div>
  );
}
