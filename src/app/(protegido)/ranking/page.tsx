'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { listarGrupos, obterRankingGeral } from '@/services/grupo.service';
import { CardRanking } from '@/components/home/card-ranking';
import { ehCampeonatoCopa } from '@/lib/jogo-helpers';

export default function RankingPage() {
  const usuario = useAuthStore((state) => state.usuario);
  const [grupoRankingId, setGrupoRankingId] = useState<string | undefined>(undefined);

  const { data: grupos } = useQuery({
    queryKey: ['grupos'],
    queryFn: listarGrupos,
  });

  const grupoFavoritoInicial = usuario?.grupoFavoritoId ?? grupos?.[0]?.id;
  const grupoSelecionadoId = grupoRankingId ?? grupoFavoritoInicial;

  const { data: ranking, isLoading: carregandoRanking } = useQuery({
    queryKey: ['ranking-page', grupoSelecionadoId],
    queryFn: () => obterRankingGeral(grupoSelecionadoId ?? ''),
    enabled: !!grupoSelecionadoId,
    staleTime: 5 * 60_000,
  });

  const gruposOpcoes = useMemo(
    () => (grupos ?? []).map((g) => ({ id: g.id, nome: g.nome })),
    [grupos],
  );

  const rankingFormatado = useMemo(
    () =>
      (ranking ?? []).map((entry) => ({
        posicao: entry.posicao,
        nome: entry.nomeUsuario,
        pontos: entry.pontuacaoTotal ?? 0,
        acertosEmCheio: entry.acertosEmCheio ?? 0,
        acertosDeResultado: entry.acertosDeResultado ?? 0,
        totalPalpites:
          (entry.acertosEmCheio ?? 0) +
          (entry.acertosDeResultado ?? 0) +
          (entry.errosTotais ?? 0),
        esquecidos: 0,
        destaque: entry.usuarioId === usuario?.id,
      })),
    [ranking, usuario?.id],
  );

  const nomeCampeonato = grupos?.find((g) => g.id === grupoSelecionadoId)?.temporada?.campeonato?.nome;
  const temaCopa = ehCampeonatoCopa(nomeCampeonato);

  return (
    <div className="min-h-screen bg-fundo pb-24">

      {/* Header */}
      <header className="sticky top-0 z-20 bg-fundo/80 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="mx-auto max-w-[480px] px-5 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5" data-dica="ranking-titulo">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primaria/30 bg-primaria/[0.08]">
                <Trophy size={20} className="text-primaria-claro drop-shadow-[0_0_10px_rgba(34,211,94,0.8)]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-texto">Ranking</h1>
                <p className="text-[10px] text-texto/30 mt-0.5">
                  Acompanhe sua posição no grupo
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[480px] px-4 pt-4">
        <CardRanking
          ranking={rankingFormatado}
          grupos={gruposOpcoes}
          grupoSelecionadoId={grupoSelecionadoId}
          onTrocarGrupo={setGrupoRankingId}
          carregando={carregandoRanking}
          temaCopa={temaCopa}
          ocultarBotaoCompleto
          mostrarTodos
        />
      </div>
    </div>
  );
}
