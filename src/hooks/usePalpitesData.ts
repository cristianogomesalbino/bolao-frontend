import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listarFases, listarJogosFase, listarTemporadas } from '@/services/jogo.service';
import { listarGrupos } from '@/services/grupo.service';
import { buscarMeusPalpitesPorJogos, listarMeusPalpites } from '@/services/palpite.service';
import { useAuthStore } from '@/stores/auth.store';
import { Jogo, CAMPEONATOS } from '@/types/jogo.types';
import { Palpite, PalpiteComJogo } from '@/types/palpite.types';

/** Verifica se o jogo aceita palpites (status correto e hora não passou) */
export function podePalpitar(jogo: Jogo): boolean {
  if (jogo.status !== 'AGENDADO' && jogo.status !== 'ADIADO') return false;
  if (jogo.dataHora && new Date(jogo.dataHora).getTime() <= Date.now()) return false;
  return true;
}

/** Verifica se o jogo está bloqueado (status palpitável mas hora já passou) */
export function estaBloqueado(jogo: Jogo): boolean {
  if (jogo.status !== 'AGENDADO' && jogo.status !== 'ADIADO') return false;
  if (!jogo.dataHora) return false;
  return new Date(jogo.dataHora).getTime() <= Date.now();
}

export function usePalpitesData(abaAtiva: 'todos' | 'meus', campeonatoSelecionado?: string) {
  const queryClient = useQueryClient();
  const usuario = useAuthStore((state) => state.usuario);

  // Grupos (precisa antes para determinar temporada)
  const { data: gruposData } = useQuery({
    queryKey: ['grupos'],
    queryFn: () => listarGrupos(),
    select: (grupos) => grupos.map((g) => ({ id: g.id, temporadaId: g.temporadaId, campeonato: g.temporada?.campeonato?.nome })),
  });

  // Label do campeonato Copa a partir do config
  const labelCopa = CAMPEONATOS.find((c) => c.slug === 'copa-do-mundo-2026')?.label ?? '';
  const palavraChaveCopa = labelCopa.split(' ')[0].toLowerCase(); // 'copa'

  function ehGrupoCopa(nomeCampeonato?: string): boolean {
    if (!nomeCampeonato) return false;
    return nomeCampeonato.toLowerCase().includes(palavraChaveCopa) && nomeCampeonato.toLowerCase().includes('mundo');
  }

  // Selecionar grupo correto baseado no campeonato selecionado
  const grupoParaCampeonato = (() => {
    if (!gruposData) return undefined;
    if (campeonatoSelecionado === 'copa-do-mundo-2026') {
      return gruposData.find((g) => ehGrupoCopa(g.campeonato));
    }
    // Brasileirão: grupo favorito ou primeiro que não é Copa
    const favoritoId = usuario?.grupoFavoritoId;
    if (favoritoId) {
      const fav = gruposData.find((g) => g.id === favoritoId && !ehGrupoCopa(g.campeonato));
      if (fav) return fav;
    }
    return gruposData.find((g) => !ehGrupoCopa(g.campeonato));
  })();

  const grupoId = grupoParaCampeonato?.id ?? usuario?.grupoFavoritoId ?? gruposData?.[0]?.id ?? '';

  // Temporadas
  const { data: temporadas } = useQuery({
    queryKey: ['temporadas'],
    queryFn: listarTemporadas,
    staleTime: 1000 * 60 * 60,
  });

  const temporadaAtual = (() => {
    if (!temporadas || temporadas.length === 0) return undefined;
    if (campeonatoSelecionado === 'copa-do-mundo-2026') {
      return temporadas.find((t) => ehGrupoCopa(t.campeonato?.nome));
    }
    // Brasileirão: buscar por nome que contém "Série A" ou primeiro que não é Copa
    return temporadas.find((t) => t.campeonato?.nome?.includes('Série A'))
      ?? temporadas.find((t) => !ehGrupoCopa(t.campeonato?.nome))
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
    staleTime: 30_000, // 30s — evita refetch em cada render
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const jogos = query.state.data?.jogos ?? [];
      const temAoVivo = jogos.some((j: Jogo) => j.status === 'EM_ANDAMENTO');
      return temAoVivo ? 60_000 : false;
    },
  });

  const rodadaAtual = jogosRodadaAtual?.rodadaAtual ?? null;
  const jogosAtual = jogosRodadaAtual?.jogos ?? [];

  const rodadaReal = jogosAtual.find((j: Jogo) => j.status === 'AGENDADO' && j.dataHora)?.rodada ?? rodadaAtual;
  const proximaRodada = rodadaReal ? rodadaReal + 1 : null;

  // Jogos próxima rodada
  const { data: jogosProximaRodada, isLoading: carregandoProxima } = useQuery({
    queryKey: ['jogos-proxima-rodada', faseAtual?.id, proximaRodada],
    queryFn: () => listarJogosFase(faseAtual!.id, proximaRodada as number),
    enabled: !!faseAtual?.id && !!proximaRodada,
    staleTime: 60_000, // 1min
  });

  const jogosProxima = jogosProximaRodada?.jogos ?? [];

  // Filtrar e ordenar jogos
  const temJogoAoVivo = jogosAtual.some((j: Jogo) => j.status === 'EM_ANDAMENTO');
  const jogosAtualVisiveis = jogosAtual
    .filter((j: Jogo) => {
      if (temJogoAoVivo && j.status === 'FINALIZADO') return false;
      return j.status === 'AGENDADO' || j.status === 'EM_ANDAMENTO' || j.status === 'FINALIZADO';
    })
    .sort((a: Jogo, b: Jogo) => {
      const ordem: Record<string, number> = { EM_ANDAMENTO: 0, AGENDADO: 1, FINALIZADO: 2 };
      return (ordem[a.status] ?? 3) - (ordem[b.status] ?? 3);
    });

  const jogosProximaVisiveis = jogosProxima.filter(
    (j: Jogo) => j.status === 'AGENDADO' || j.status === 'EM_ANDAMENTO'
  );

  // Batch de palpites
  const todosJogoIds = [...jogosAtualVisiveis, ...jogosProximaVisiveis].map((j) => j.id);

  const { data: palpitesBatch, isFetching: carregandoBatch } = useQuery({
    queryKey: ['meus-palpites-batch', faseAtual?.id, rodadaReal, proximaRodada, usuario?.id],
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

  // Meus palpites anteriores
  const { data: meusPalpitesAnteriores, isLoading: carregandoPalpites, isFetching: buscandoPalpites } = useQuery({
    queryKey: ['meus-palpites-historico', temporadaId, usuario?.id],
    queryFn: () => listarMeusPalpites(temporadaId),
    enabled: !!temporadaId && abaAtiva === 'meus',
  });

  const palpitesFinalizados = (meusPalpitesAnteriores ?? [])
    .filter((p: PalpiteComJogo) => p.jogo?.status === 'FINALIZADO')
    .sort((a: PalpiteComJogo, b: PalpiteComJogo) => (b.jogo?.rodada ?? 0) - (a.jogo?.rodada ?? 0));

  const palpitesPorRodada = palpitesFinalizados.reduce<Record<number, PalpiteComJogo[]>>((acc, p) => {
    const rodada = p.jogo?.rodada ?? 0;
    if (!acc[rodada]) acc[rodada] = [];
    acc[rodada].push(p);
    return acc;
  }, {});

  // Ordenar jogos dentro de cada rodada
  for (const rodada of Object.keys(palpitesPorRodada)) {
    palpitesPorRodada[Number(rodada)].sort((a: PalpiteComJogo, b: PalpiteComJogo) => {
      const dataA = a.jogo?.dataHora ? new Date(a.jogo.dataHora).getTime() : 0;
      const dataB = b.jogo?.dataHora ? new Date(b.jogo.dataHora).getTime() : 0;
      return dataB - dataA;
    });
  }

  return {
    temporadaId,
    grupoId,
    faseAtual,
    fases,
    ehCopaMundo,
    rodadaAtual,
    proximaRodada,
    jogosAtualVisiveis,
    jogosProximaVisiveis,
    palpitesPorJogo,
    palpitesFinalizados,
    palpitesPorRodada,
    isLoading,
    carregandoBatch,
    carregandoProxima,
    carregandoPalpites,
    buscandoPalpites,
    palpitesBatch,
  };
}
