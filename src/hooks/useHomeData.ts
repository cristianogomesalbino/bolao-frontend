import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { listarGrupos, obterRankingGeral } from '@/services/grupo.service';
import { buscarDadosTemporada, listarTemporadas } from '@/services/jogo.service';
import { buscarEstatisticasPalpite, buscarMeuPalpite } from '@/services/palpite.service';
import { CAMPEONATOS } from '@/types/jogo.types';

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
    staleTime: 60_000,
  });

  // Temporadas
  const { data: temporadas } = useQuery({
    queryKey: ['temporadas'],
    queryFn: listarTemporadas,
    staleTime: 300_000,
  });

  // Temporada do grupo favorito
  const temporadaId = grupos?.find((g) => g.id === grupoFavoritoInicial)?.temporadaId ?? temporadas?.[0]?.id;

  // Dados da temporada (próximo jogo)
  const { data: dadosTemporada } = useQuery({
    queryKey: ['dados-temporada-home', temporadaId],
    queryFn: () => buscarDadosTemporada(temporadaId ?? ''),
    enabled: !!temporadaId,
    staleTime: 60_000,
  });

  const proximoJogo = dadosTemporada?.proximoJogo;
  const jogoId = proximoJogo?.jogo.id;

  // Estatísticas do próximo jogo
  const { data: estatisticas } = useQuery({
    queryKey: ['estatisticas-palpite-home', grupoFavoritoInicial, jogoId],
    queryFn: () => buscarEstatisticasPalpite(grupoFavoritoInicial ?? '', jogoId ?? ''),
    enabled: !!grupoFavoritoInicial && !!jogoId,
    staleTime: 30_000,
  });

  // Meu palpite no próximo jogo
  const { data: meuPalpite } = useQuery({
    queryKey: ['meu-palpite-home', jogoId],
    queryFn: () => buscarMeuPalpite(jogoId ?? ''),
    enabled: !!jogoId,
    staleTime: Infinity,
  });

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

  // Detecção de Copa — usa label do config como padrão de busca (case-insensitive)
  const labelCopa = CAMPEONATOS.find((c) => c.slug === 'copa-do-mundo-2026')?.label ?? '';
  const palavraChaveCopa = labelCopa.split(' ')[0].toLowerCase(); // 'copa'

  function ehCampeonatoCopa(nome?: string): boolean {
    if (!nome) return false;
    return nome.toLowerCase().includes(palavraChaveCopa) && nome.toLowerCase().includes('mundo');
  }

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
    estatisticas,
    meuPalpite,
    rankingFormatado,
    gruposOpcoes,
    carregandoRanking,
    ehCopa,
    ehCopaRanking,
  };
}
