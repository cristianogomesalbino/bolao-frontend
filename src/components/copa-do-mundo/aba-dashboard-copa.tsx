'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CardRanking } from '@/components/home/card-ranking';
import { CardProximoJogoCopa } from './card-proximo-jogo-copa';
import { buscarDadosTemporada } from '@/services/jogo.service';
import { buscarMeusPalpitesPorJogos } from '@/services/palpite.service';
import { obterRankingGeral, obterRankingFase } from '@/services/grupo.service';
import { useAuthStore } from '@/stores/auth.store';


interface PropsAbaDashboardCopa {
  grupoId: string;
  temporadaId: string;
}

export function AbaDashboardCopa({ grupoId, temporadaId }: Readonly<PropsAbaDashboardCopa>) {
  const usuario = useAuthStore((state) => state.usuario);
  const [filtroAtivo, setFiltroAtivo] = useState<'geral' | 'rodada'>('geral');
  const [rodadaSelecionada, setRodadaSelecionada] = useState<number | null>(1);

  const { data: dadosTemporada } = useQuery({
    queryKey: ['grupo', grupoId, 'dados-temporada'],
    queryFn: () => buscarDadosTemporada(temporadaId),
    enabled: !!temporadaId,
    staleTime: 1000 * 60 * 5,
  });

  const proximoJogo = dadosTemporada?.proximoJogo ?? null;

  // Buscar total de rodadas da temporada
  const { data: totalRodadas } = useQuery({
    queryKey: ['total-rodadas-copa', temporadaId],
    queryFn: async () => {
      const { listarJogosTemporada } = await import('@/services/jogo.service');
      const jogos = await listarJogosTemporada(temporadaId);
      const rodadas = new Set(jogos.map((j) => j.rodada).filter((r): r is number => r != null));
      return Math.max(...rodadas, 1);
    },
    enabled: !!temporadaId,
    staleTime: 1000 * 60 * 30,
  });
  const rodadaMax = totalRodadas ?? 3;

  const proximoJogoId = proximoJogo?.jogo.id;
  const { data: palpitesProximoJogo } = useQuery({
    queryKey: ['meus-palpites-batch', 'copa-dashboard', proximoJogoId],
    queryFn: () => buscarMeusPalpitesPorJogos([proximoJogoId!]),
    enabled: !!proximoJogoId,
    staleTime: 1000 * 60 * 5,
  });
  const palpiteProximoJogo = palpitesProximoJogo?.[0] ?? null;

  const { data: rankingGeral, isLoading: carregandoRanking } = useQuery({
    queryKey: ['grupo', grupoId, 'ranking', 'geral'],
    queryFn: () => obterRankingGeral(grupoId),
    enabled: !!grupoId,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  // Ranking por rodada
  const { data: rankingRodadaData } = useQuery({
    queryKey: ['grupo', grupoId, 'ranking', 'rodada', proximoJogo?.fase.id, rodadaSelecionada],
    queryFn: () => obterRankingFase(grupoId, proximoJogo?.fase.id ?? '', rodadaSelecionada ?? undefined),
    enabled: !!grupoId && !!proximoJogo?.fase.id && filtroAtivo === 'rodada' && !!rodadaSelecionada,
  });

  const minhaPosicao = rankingGeral?.find((r) => r.usuarioId === usuario?.id);
  const lider = rankingGeral?.[0];
  const ptsAtrasDoLider = lider && minhaPosicao ? lider.pontuacaoTotal - minhaPosicao.pontuacaoTotal : 0;

  // Formatar ranking para o CardRanking (mesmo formato da home)
  const rankingFormatado = (rankingGeral ?? []).map((entry) => ({
    posicao: entry.posicao,
    nome: entry.nomeUsuario,
    pontos: entry.pontuacaoTotal ?? 0,
    acertosEmCheio: entry.acertosEmCheio ?? 0,
    acertosDeResultado: entry.acertosDeResultado ?? 0,
    totalPalpites: (entry.acertosEmCheio ?? 0) + (entry.acertosDeResultado ?? 0) + (entry.errosTotais ?? 0),
    esquecidos: 0,
    destaque: entry.usuarioId === usuario?.id,
  }));

  return (
    <div className="space-y-3">
      {/* Próximo Jogo */}
      {proximoJogo && (
        <CardProximoJogoCopa
          jogo={proximoJogo.jogo}
          fase={proximoJogo.fase}
          palpiteInicial={palpiteProximoJogo}
          grupoId={grupoId}
        />
      )}

      {!proximoJogo && (
        <div className="rounded-xl border border-[#009c3b]/20 bg-[#009c3b]/[0.04] p-4 text-center">
          <p className="text-[11px] text-[#a8e6b0]/70">Nenhum jogo agendado no momento</p>
        </div>
      )}

      {/* Card Sua Posição */}
      {minhaPosicao && (
        <Card className="border-[#009c3b]/30 bg-[#009c3b]/[0.06]">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <User size={16} className="text-[#ffdf00]" />
              <span className="text-[11px] text-[#a8e6b0] uppercase tracking-wider font-semibold">
                Sua Posição
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-4xl font-bold text-[#ffdf00]">{minhaPosicao.posicao}º</span>
                <div>
                  <p className="text-lg font-bold text-white">{minhaPosicao.pontuacaoTotal} pts</p>
                  {ptsAtrasDoLider > 0 && (
                    <p className="text-[11px] text-[#a8e6b0]/60">{ptsAtrasDoLider} pts atrás do líder</p>
                  )}
                  {ptsAtrasDoLider === 0 && minhaPosicao.posicao === 1 && (
                    <p className="text-[11px] text-[#ffdf00]/80">Você é o líder! 🏆</p>
                  )}
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ffdf00]/10 border border-[#ffdf00]/30">
                <Trophy size={22} className="text-[#ffdf00]" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ranking — reutiliza o componente da home */}
      <CardRanking
        ranking={rankingFormatado}
        grupos={[]}
        grupoSelecionadoId={grupoId}
        onTrocarGrupo={() => {}}
        carregando={carregandoRanking}
        temaCopa
        ocultarBotaoCompleto
        mostrarTodos
        filtroRodada={{
          ativo: true,
          rodadaSelecionada,
          rodadaMax,
          onTrocarFiltro: setFiltroAtivo,
          onTrocarRodada: setRodadaSelecionada,
          rankingRodada: (rankingRodadaData ?? []).map((entry) => ({
            posicao: entry.posicao,
            nome: entry.nomeUsuario,
            pontos: entry.pontuacaoTotal ?? 0,
            acertosEmCheio: entry.acertosEmCheio ?? 0,
            acertosDeResultado: entry.acertosDeResultado ?? 0,
            totalPalpites: (entry.acertosEmCheio ?? 0) + (entry.acertosDeResultado ?? 0) + (entry.errosTotais ?? 0),
            esquecidos: 0,
            destaque: entry.usuarioId === usuario?.id,
          })),
          filtroAtivo,
        }}
      />
    </div>
  );
}
