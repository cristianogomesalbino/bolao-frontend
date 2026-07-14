import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listarFases, listarJogosFase, listarJogosTemporada, listarTemporadas } from '@/services/jogo.service';
import { listarGrupos } from '@/services/grupo.service';
import { buscarMeusPalpitesPorJogos, listarMeusPalpites } from '@/services/palpite.service';
import { useAuthStore } from '@/stores/auth.store';
import { Jogo } from '@/types/jogo.types';
import { Palpite, PalpiteComJogo } from '@/types/palpite.types';
import { ehCampeonatoCopa } from '@/lib/jogo-helpers';

/** Verifica se o jogo aceita palpites (status correto e hora não passou) */
export function podePalpitar(jogo: Jogo): boolean {
  if (jogo.status !== 'AGENDADO' && jogo.status !== 'ADIADO') return false;
  if (jogo.dataHora && new Date(jogo.dataHora).getTime() <= Date.now()) return false;
  if (!temTimesDefinidos(jogo)) return false;
  if (estaPendenteConfirmacao(jogo)) return false;
  return true;
}

/** Verifica se o jogo está bloqueado (status palpitável mas hora já passou) */
export function estaBloqueado(jogo: Jogo): boolean {
  if (jogo.status !== 'AGENDADO' && jogo.status !== 'ADIADO') return false;
  if (!jogo.dataHora) return false;
  return new Date(jogo.dataHora).getTime() <= Date.now();
}

/** Verifica se o jogo está pendente de confirmação pela API (times podem estar invertidos) */
export function estaPendenteConfirmacao(jogo: Jogo): boolean {
  return jogo.fonteResultado === 'API_EXTERNA' && !jogo.externoId;
}

/** Verifica se ambos os times do jogo são reais (não placeholders/TBD) */
export function temTimesDefinidos(jogo: Jogo): boolean {
  const ehPlaceholder = (nome?: string, sigla?: string) => {
    if (!nome || !sigla) return true;
    if (sigla === 'TBD') return true;
    if (/^\d[ºo°]\s/.test(nome)) return true;
    if (/^[A-Z]{2,}\s[A-L]{3,}/i.test(nome)) return true;
    if (/\sou\s/i.test(nome)) return true;
    return false;
  };
  return !ehPlaceholder(jogo.timeCasa?.nome, jogo.timeCasa?.sigla) &&
         !ehPlaceholder(jogo.timeFora?.nome, jogo.timeFora?.sigla);
}

export function usePalpitesData(abaAtiva: 'todos' | 'meus', campeonatoSelecionado?: string) {
  const queryClient = useQueryClient();
  const usuario = useAuthStore((state) => state.usuario);

  // Grupos (precisa antes para determinar temporada)
  const { data: gruposData } = useQuery({
    queryKey: ['grupos'],
    queryFn: () => listarGrupos(),
    select: (grupos) => grupos.map((g) => ({ id: g.id, nome: g.nome, temporadaId: g.temporadaId, campeonato: g.temporada?.campeonato?.nome })),
  });

  // Selecionar grupo correto baseado no campeonato selecionado
  const grupoParaCampeonato = (() => {
    if (!gruposData) return undefined;
    const favoritoId = usuario?.grupoFavoritoId;

    if (campeonatoSelecionado === 'copa-do-mundo-2026') {
      const gruposCopa = gruposData.filter((g) => ehCampeonatoCopa(g.campeonato));
      if (gruposCopa.length === 0) return undefined;
      const favCopa = favoritoId ? gruposCopa.find((g) => g.id === favoritoId) : undefined;
      return favCopa ?? gruposCopa[0];
    }

    // Brasileirão: grupo favorito ou primeiro que não é Copa
    const gruposBrasileirao = gruposData.filter((g) => !ehCampeonatoCopa(g.campeonato));
    if (gruposBrasileirao.length === 0) return undefined;
    const favBr = favoritoId ? gruposBrasileirao.find((g) => g.id === favoritoId) : undefined;
    return favBr ?? gruposBrasileirao[0];
  })();

  const grupoId = grupoParaCampeonato?.id ?? '';

  // Grupos disponíveis para o campeonato selecionado (para modal de favorito)
  // Usa temporadaId como critério principal (mais confiável que nome do campeonato)
  const gruposDisponiveis = (() => {
    if (!gruposData || !grupoParaCampeonato) return [];
    const temporadaAlvo = grupoParaCampeonato.temporadaId;
    return gruposData
      .filter((g) => g.temporadaId === temporadaAlvo)
      .map((g) => ({ id: g.id, nome: g.nome }));
  })();

  // Indica se o favorito do usuário pertence ao campeonato ativo
  const favoritoNoCampeonato = (() => {
    if (gruposDisponiveis.length <= 1) return true; // Só 1 grupo, não precisa de escolha
    const favoritoId = usuario?.grupoFavoritoId;
    if (!favoritoId) return false;
    return gruposDisponiveis.some((g) => g.id === favoritoId);
  })();

  // Temporadas
  const { data: temporadas } = useQuery({
    queryKey: ['temporadas'],
    queryFn: listarTemporadas,
    staleTime: 1000 * 60 * 60,
  });

  const temporadaAtual = (() => {
    if (!temporadas || temporadas.length === 0) return undefined;
    if (campeonatoSelecionado === 'copa-do-mundo-2026') {
      return temporadas.find((t) => ehCampeonatoCopa(t.campeonato?.nome));
    }
    // Brasileirão: buscar por nome que contém "Série A" ou primeiro que não é Copa
    return temporadas.find((t) => t.campeonato?.nome?.includes('Série A'))
      ?? temporadas.find((t) => !ehCampeonatoCopa(t.campeonato?.nome))
      ?? temporadas[0];
  })();
  const temporadaId = temporadaAtual?.id || '';
  const ehCopaMundo = campeonatoSelecionado === 'copa-do-mundo-2026';

  // Fases
  const { data: fases } = useQuery({
    queryKey: ['fases', temporadaId],
    queryFn: () => listarFases(temporadaId),
    enabled: !!temporadaId,
  });

  const faseAtual = fases?.[0];

  // Jogos rodada atual
  const { data: jogosRodadaAtual, isLoading } = useQuery({
    queryKey: ['jogos-rodada-atual', faseAtual?.id],
    queryFn: () => listarJogosFase(faseAtual!.id),
    enabled: !!faseAtual?.id,
    staleTime: 5 * 60_000,
    refetchInterval: (query) => {
      const jogos = query.state.data?.jogos ?? [];
      const temAoVivo = jogos.some((j: Jogo) => j.status === 'EM_ANDAMENTO');
      return temAoVivo ? 60_000 : false;
    },
  });

  const rodadaAtual = jogosRodadaAtual?.rodadaAtual ?? null;

  // Buscar TODOS os jogos AGENDADOS da fase em ordem cronológica (independente de rodada)
  const { data: todosAgendadosData, isLoading: carregandoProxima } = useQuery({
    queryKey: ['jogos-todos-agendados', faseAtual?.id],
    queryFn: () => listarJogosFase(faseAtual!.id, undefined, 'AGENDADO'),
    enabled: !!faseAtual?.id,
    staleTime: 5 * 60_000,
  });

  // Ordenar todos os jogos AGENDADOS por data (cronológico puro)
  const todosAgendados = [...(todosAgendadosData?.jogos ?? [])].sort((a: Jogo, b: Jogo) => {
    const dataA = a.dataHora ? new Date(a.dataHora).getTime() : Infinity;
    const dataB = b.dataHora ? new Date(b.dataHora).getTime() : Infinity;
    return dataA - dataB;
  });

  // Limitar a 20 jogos (timeline cronológica, tags de rodada repetidas conforme necessário)
  const jogosVisiveis = todosAgendados.slice(0, 20);

  // Timeline cronológica: tudo em jogosAtualVisiveis (já ordenado por data), sem separação por rodada
  const jogosAtualVisiveis = jogosVisiveis;
  const jogosProximaVisiveis: Jogo[] = [];
  const primeiraRodada = jogosVisiveis[0]?.rodada ?? null;
  const proximaRodada: number | null = null;

  // Batch de palpites
  const todosJogoIds = [...jogosAtualVisiveis, ...jogosProximaVisiveis].map((j) => j.id);

  const { data: palpitesBatch, isFetching: carregandoBatch } = useQuery({
    queryKey: ['meus-palpites-batch', faseAtual?.id, primeiraRodada, proximaRodada, usuario?.id],
    queryFn: async () => {
      const palpites = await buscarMeusPalpitesPorJogos(todosJogoIds);
      const palpitesPorJogo: Record<string, Palpite> = {};
      for (const p of palpites) {
        palpitesPorJogo[p.jogoId] = p;
      }
      for (const jogoId of todosJogoIds) {
        queryClient.setQueryData(['meu-palpite', jogoId], palpitesPorJogo[jogoId] ?? null);
      }
      return palpitesPorJogo;
    },
    enabled: todosJogoIds.length > 0 && !isLoading,
    staleTime: 1000 * 60 * 5,
  });

  const palpitesPorJogo = palpitesBatch ?? {};

  // Primeiro jogo palpitável sem palpite (para auto-scroll)
  const primeiroJogoPalpitavel = jogosAtualVisiveis.find(
    (j) => podePalpitar(j) && !palpitesPorJogo[j.id]
  )?.id ?? jogosProximaVisiveis.find(
    (j) => podePalpitar(j) && !palpitesPorJogo[j.id]
  )?.id ?? null;

  // Meus palpites anteriores
  const { data: meusPalpitesAnteriores, isLoading: carregandoPalpites, isFetching: buscandoPalpites } = useQuery({
    queryKey: ['meus-palpites-historico', temporadaId, usuario?.id],
    queryFn: () => listarMeusPalpites(temporadaId),
    enabled: !!temporadaId && abaAtiva === 'meus',
  });

  // Todos os jogos da temporada (para mostrar jogos finalizados sem palpite)
  const { data: todosJogosTemporada } = useQuery({
    queryKey: ['jogos-temporada-todos', temporadaId],
    queryFn: () => listarJogosTemporada(temporadaId),
    enabled: !!temporadaId && abaAtiva === 'meus',
    staleTime: 1000 * 60 * 5,
  });

  // Mesclar palpites com jogos finalizados sem palpite
  const palpitesFinalizados = (() => {
    const palpitesComJogo = (meusPalpitesAnteriores ?? [])
      .filter((p: PalpiteComJogo) => p.jogo?.status === 'FINALIZADO');

    const jogosFinalizados = (todosJogosTemporada ?? [])
      .filter((j: Jogo) => j.status === 'FINALIZADO');

    // IDs dos jogos que já têm palpite
    const jogoIdsComPalpite = new Set(palpitesComJogo.map((p) => p.jogo?.id).filter(Boolean));

    // Criar entradas "sem palpite" para jogos finalizados que o usuário não palpitou
    const jogosSemPalpite: PalpiteComJogo[] = jogosFinalizados
      .filter((j) => !jogoIdsComPalpite.has(j.id))
      .map((j) => ({
        id: `sem-palpite-${j.id}`,
        golsCasa: -1,
        golsFora: -1,
        jogoId: j.id,
        usuarioId: usuario?.id ?? '',
        dataCriacao: '',
        atualizadoEm: '',
        jogo: {
          id: j.id,
          faseId: j.faseId,
          rodada: j.rodada,
          status: j.status,
          dataHora: j.dataHora,
          golsCasa: j.golsCasa,
          golsFora: j.golsFora,
          foiAdiado: j.foiAdiado ?? false,
          temPenaltis: j.temPenaltis ?? false,
          penaltisCasa: j.penaltisCasa ?? null,
          penaltisFora: j.penaltisFora ?? null,
          timeCasa: j.timeCasa ?? null,
          timeFora: j.timeFora ?? null,
        },
      }));

    return [...palpitesComJogo, ...jogosSemPalpite]
      .sort((a: PalpiteComJogo, b: PalpiteComJogo) => {
        const dataA = a.jogo?.dataHora ? new Date(a.jogo.dataHora).getTime() : 0;
        const dataB = b.jogo?.dataHora ? new Date(b.jogo.dataHora).getTime() : 0;
        return dataB - dataA;
      });
  })();

  return {
    temporadaId,
    grupoId,
    gruposDisponiveis,
    favoritoNoCampeonato,
    faseAtual,
    fases,
    ehCopaMundo,
    rodadaAtual,
    proximaRodada,
    jogosAtualVisiveis,
    jogosProximaVisiveis,
    palpitesPorJogo,
    palpitesFinalizados,
    isLoading,
    carregandoBatch,
    carregandoProxima,
    carregandoPalpites,
    buscandoPalpites,
    palpitesBatch,
    primeiroJogoPalpitavel,
  };
}
