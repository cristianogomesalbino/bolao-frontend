import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { listarGrupos, obterRankingGeral } from '@/services/grupo.service';
import { buscarDadosTemporada, listarTemporadas } from '@/services/jogo.service';
import { buscarMeuPalpite } from '@/services/palpite.service';
import { ehCampeonatoCopa } from '@/lib/jogo-helpers';
import type { Fase, Jogo } from '@/types/jogo.types';

export interface ProximoJogoPorCampeonato {
  campeonato: string;
  ehCopa: boolean;
  jogos: { fase: Fase; jogo: Jogo }[];
}

export function useHomeData() {
  const usuario = useAuthStore((state) => state.usuario);

  // Grupo do ranking persistido em memória (sem expor na URL)
  const [grupoRankingId, setGrupoRankingId] = useState<string | undefined>(undefined);

  // Grupos do usuário
  const { data: grupos, isLoading: carregandoGrupos } = useQuery({
    queryKey: ['grupos'],
    queryFn: listarGrupos,
  });

  const grupoFavoritoInicial = usuario?.grupoFavoritoId ?? grupos?.[0]?.id;
  const grupoSelecionadoId = grupoRankingId ?? grupoFavoritoInicial;

  // Ranking
  const { data: ranking, isLoading: carregandoRanking } = useQuery({
    queryKey: ['ranking-home', grupoSelecionadoId],
    queryFn: () => obterRankingGeral(grupoSelecionadoId ?? ''),
    enabled: !!grupoSelecionadoId,
    staleTime: 5 * 60_000,
  });

  // Temporadas
  const { data: temporadas } = useQuery({
    queryKey: ['temporadas'],
    queryFn: listarTemporadas,
    staleTime: 300_000,
  });

  // Temporada do grupo favorito (quando tem grupo)
  // Quando não tem grupo, busca de TODAS as temporadas o próximo jogo mais próximo
  const temporadaIdDoGrupo = grupos?.find((g) => g.id === grupoFavoritoInicial)?.temporadaId;
  const temGrupo = !!grupoFavoritoInicial && !!grupos && grupos.length > 0;

  // Dados da temporada do grupo favorito (próximo jogo)
  const { data: dadosTemporadaGrupo } = useQuery({
    queryKey: ['dados-temporada-home', temporadaIdDoGrupo],
    queryFn: () => buscarDadosTemporada(temporadaIdDoGrupo ?? ''),
    enabled: !!temporadaIdDoGrupo,
    staleTime: 5 * 60_000,
  });

  // Buscar próximo jogo de TODAS as temporadas (sempre, para multi-campeonato na home)
  const { data: dadosTodasTemporadas } = useQuery({
    queryKey: ['dados-temporada-home-todas', temporadas?.map((t) => t.id) ?? []],
    queryFn: async () => {
      if (!temporadas || temporadas.length === 0) return [];
      const recentes = temporadas.slice(0, 3);
      const resultados = await Promise.all(
        recentes.map(async (t) => {
          const dados = await buscarDadosTemporada(t.id);
          return { temporadaId: t.id, campeonato: t.campeonato?.nome ?? '', ...dados };
        })
      );
      return resultados;
    },
    enabled: !!temporadas && temporadas.length > 0,
    staleTime: 5 * 60_000,
  });

  // Montar lista de próximos jogos por campeonato (1 card por campeonato com jogo disponível)
  const proximosJogosPorCampeonato: ProximoJogoPorCampeonato[] = (() => {
    if (!dadosTodasTemporadas || dadosTodasTemporadas.length === 0) return [];
    return dadosTodasTemporadas
      .filter((r) => r.proximoJogo)
      .map((r) => {
        const temMultiplos = r.proximosJogos && r.proximosJogos.length > 0;
        const jogoUnico = r.proximoJogo ? [r.proximoJogo] : [];
        const jogosRaw = temMultiplos ? r.proximosJogos : jogoUnico;
        return {
          campeonato: r.campeonato,
          ehCopa: ehCampeonatoCopa(r.campeonato),
          jogos: jogosRaw,
        };
      })
      // Ordenar: jogo mais próximo primeiro
      .sort((a, b) => {
        const dataA = new Date(a.jogos[0]?.jogo.dataHora ?? '').getTime();
        const dataB = new Date(b.jogos[0]?.jogo.dataHora ?? '').getTime();
        return dataA - dataB;
      });
  })();

  // Selecionar o próximo jogo principal (para o grupo favorito ou o mais próximo global)
  const dadosTemporadaPrincipal = (() => {
    if (temGrupo && dadosTemporadaGrupo) return dadosTemporadaGrupo;
    // Sem grupo: pegar o mais próximo de qualquer temporada
    if (!dadosTodasTemporadas || dadosTodasTemporadas.length === 0) return null;
    const agora = Date.now();
    const comJogo = dadosTodasTemporadas.filter((r) => r.proximoJogo?.jogo.dataHora);
    comJogo.sort((a, b) => {
      const dataA = new Date(a.proximoJogo?.jogo.dataHora ?? '').getTime();
      const dataB = new Date(b.proximoJogo?.jogo.dataHora ?? '').getTime();
      return dataA - dataB;
    });
    const futuro = comJogo.find((r) => new Date(r.proximoJogo?.jogo.dataHora ?? '').getTime() > agora);
    return futuro ?? comJogo[0] ?? null;
  })();

  const dadosTemporada = dadosTemporadaPrincipal;

  const proximoJogo = dadosTemporada?.proximoJogo;
  // Fallback: se backend não retornar proximosJogos, usa o proximoJogo como array de 1
  const proximosJogosRaw = dadosTemporada?.proximosJogos;
  const temProximosJogos = proximosJogosRaw && proximosJogosRaw.length > 0;
  const fallbackProximoJogo = proximoJogo ? [proximoJogo] : [];
  // Mostrar todos os jogos simultâneos (mesmo horário)
  const proximosJogosFull = temProximosJogos ? proximosJogosRaw : fallbackProximoJogo;
  const proximosJogos = proximosJogosFull;
  const jogoId = proximoJogo?.jogo.id;

  // Meu palpite no próximo jogo (palpite é livre, não precisa de grupo)
  const { data: meuPalpite } = useQuery({
    queryKey: ['meu-palpite-home', jogoId],
    queryFn: () => buscarMeuPalpite(jogoId ?? ''),
    enabled: !!jogoId,
    staleTime: Infinity,
  });

  // Card do próximo jogo renderiza assim que tiver os dados do jogo
  const proximoJogoPronto = !!proximoJogo;

  // Ranking formatado
  const rankingFormatado = (ranking ?? []).slice(0, 8).map((entry) => ({
    posicao: entry.posicao,
    nome: entry.nomeUsuario,
    pontos: entry.pontuacaoTotal ?? 0,
    acertosEmCheio: entry.acertosEmCheio ?? 0,
    acertosDeResultado: entry.acertosDeResultado ?? 0,
    totalPalpites: (entry.acertosEmCheio ?? 0) + (entry.acertosDeResultado ?? 0) + (entry.errosTotais ?? 0),
    esquecidos: 0,
    destaque: entry.usuarioId === usuario?.id,
  }));

  // Opções de grupo para filtro
  const gruposOpcoes = (grupos ?? []).map((g) => ({ id: g.id, nome: g.nome }));

  const nomeCampeonato = grupos?.find((g) => g.id === grupoFavoritoInicial)?.temporada?.campeonato?.nome;
  const ehCopa = ehCampeonatoCopa(nomeCampeonato);
  const nomeCampeonatoRanking = grupos?.find((g) => g.id === grupoSelecionadoId)?.temporada?.campeonato?.nome;
  const ehCopaRanking = ehCampeonatoCopa(nomeCampeonatoRanking);

  return {
    usuario,
    grupos,
    carregandoGrupos,
    grupoFavoritoInicial,
    grupoSelecionadoId,
    setGrupoRankingId,
    proximoJogo,
    proximosJogos,
    proximoJogoPronto,
    proximosJogosPorCampeonato,
    meuPalpite,
    rankingFormatado,
    gruposOpcoes,
    carregandoRanking,
    ehCopa,
    ehCopaRanking,
  };
}
