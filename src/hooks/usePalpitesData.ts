import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listarFases, listarJogosFase, listarTemporadas } from '@/services/jogo.service';
import { listarGrupos } from '@/services/grupo.service';
import { buscarMeusPalpitesPorJogos, listarMeusPalpites } from '@/services/palpite.service';
import { useAuthStore } from '@/stores/auth.store';
import { Jogo } from '@/types/jogo.types';
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

export function usePalpitesData(abaAtiva: 'todos' | 'meus') {
  const queryClient = useQueryClient();
  const usuario = useAuthStore((state) => state.usuario);

  // Temporadas
  const { data: temporadas } = useQuery({
    queryKey: ['temporadas'],
    queryFn: listarTemporadas,
    staleTime: 1000 * 60 * 60,
  });

  const temporadaAtual = temporadas?.find((t) => t.campeonato?.nome.includes('Série A')) ?? temporadas?.[0];
  const temporadaId = temporadaAtual?.id || '';

  // Grupos
  const { data: gruposData } = useQuery({
    queryKey: ['grupos'],
    queryFn: () => listarGrupos(),
    select: (grupos) => grupos.map((g) => ({ id: g.id, temporadaId: g.temporadaId })),
  });

  const grupoId = usuario?.grupoFavoritoId ?? gruposData?.[0]?.id ?? '';

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
    staleTime: 0,
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
    enabled: !!faseAtual?.id && !!proximaRodada && proximaRodada <= 38,
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
    queryKey: ['meus-palpites-batch', faseAtual?.id, rodadaReal, proximaRodada, usuario?.id, todosJogoIds.join(',')],
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
