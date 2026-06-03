'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, User, ChevronRight, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CardProximoJogoCopa } from './card-proximo-jogo-copa';
import { buscarDadosTemporada } from '@/services/jogo.service';
import { obterRankingGeral, obterRankingFase } from '@/services/grupo.service';
import { useAuthStore } from '@/stores/auth.store';


interface PropsAbaDashboardCopa {
  grupoId: string;
  temporadaId: string;
}

export function AbaDashboardCopa({ grupoId, temporadaId }: Readonly<PropsAbaDashboardCopa>) {
  const usuario = useAuthStore((state) => state.usuario);
  const [rankingExpandido, setRankingExpandido] = useState(false);

  const { data: dadosTemporada } = useQuery({
    queryKey: ['grupo', grupoId, 'dados-temporada'],
    queryFn: () => buscarDadosTemporada(temporadaId),
    enabled: !!temporadaId,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });

  const proximoJogo = dadosTemporada?.proximoJogo ?? null;

  const { data: rankingGeral, isLoading: carregandoRanking } = useQuery({
    queryKey: ['grupo', grupoId, 'ranking', 'geral'],
    queryFn: () => obterRankingGeral(grupoId),
    enabled: !!grupoId,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Ranking da rodada anterior para calcular variação
  const rodadaAtual = proximoJogo?.jogo.rodada ?? null;
  const rodadaAnterior = rodadaAtual && rodadaAtual > 1 ? rodadaAtual - 1 : null;

  const { data: rankingAnterior } = useQuery({
    queryKey: ['grupo', grupoId, 'ranking', 'ateRodada', proximoJogo?.fase.id, rodadaAnterior],
    queryFn: () => {
      const rodada = rodadaAnterior ?? 1;
      return obterRankingFase(grupoId, proximoJogo!.fase.id, undefined, rodada);
    },
    enabled: !!grupoId && !!proximoJogo?.fase.id && !!rodadaAnterior,
  });

  const minhaPosicao = rankingGeral?.find((r) => r.usuarioId === usuario?.id);
  const lider = rankingGeral?.[0];
  const ptsAtrasDoLider = lider && minhaPosicao ? lider.pontuacaoTotal - minhaPosicao.pontuacaoTotal : 0;

  const top3 = (rankingGeral?.length ?? 0) >= 3 ? rankingGeral!.slice(0, 3) : [];
  const restoRanking = top3.length >= 3 ? (rankingGeral?.slice(3) ?? []) : (rankingGeral ?? []);

  function obterVariacao(usuarioId: string): number {
    if (!rankingAnterior?.length || !rankingGeral) return 0;
    const posAnterior = rankingAnterior.find((r) => r.usuarioId === usuarioId)?.posicao;
    const posAtual = rankingGeral.find((r) => r.usuarioId === usuarioId)?.posicao;
    if (!posAnterior || !posAtual) return 0;
    return posAnterior - posAtual;
  }

  return (
    <div className="space-y-3">
      {/* Próximo Jogo */}
      {proximoJogo && (
        <CardProximoJogoCopa jogo={proximoJogo.jogo} fase={proximoJogo.fase} />
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

      {/* Ranking Completo */}
      <Card className="border-[#009c3b]/30 bg-[#009c3b]/[0.06]">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Trophy size={16} className="text-[#ffdf00]" />
            <span className="text-[11px] text-[#a8e6b0] uppercase tracking-wider font-semibold">
              Ranking
            </span>
          </div>

          {/* Pódio Top 3 */}
          {top3.length >= 3 && (
            <div className="flex items-end justify-center gap-3 mb-4 pb-4 border-b border-[#009c3b]/20">
              {/* 2º lugar */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-[#a8e6b0]/50 font-bold mb-1">2</span>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] text-[#a8e6b0] text-sm font-bold border-2 border-white/[0.12]">
                  {top3[1].nomeUsuario.charAt(0)}
                </div>
                <span className="text-[10px] text-[#a8e6b0] font-medium mt-1">{top3[1].nomeUsuario.split(' ')[0]}</span>
                <span className="text-[10px] text-[#ffdf00] font-bold">{top3[1].pontuacaoTotal} pts</span>
              </div>
              {/* 1º lugar */}
              <div className="flex flex-col items-center -mt-3">
                <span className="text-[#ffdf00] text-sm mb-1">👑</span>
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#ffdf00]/20 text-[#ffdf00] text-base font-bold border-2 border-[#ffdf00]/50 shadow-[0_0_12px_rgba(255,223,0,0.3)]">
                  {top3[0].nomeUsuario.charAt(0)}
                </div>
                <span className="text-[11px] text-white font-semibold mt-1">{top3[0].nomeUsuario.split(' ')[0]}</span>
                <span className="text-[11px] text-[#ffdf00] font-bold">{top3[0].pontuacaoTotal} pts</span>
              </div>
              {/* 3º lugar */}
              <div className="flex flex-col items-center">
                <span className="text-[10px] text-[#a8e6b0]/50 font-bold mb-1">3</span>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] text-[#a8e6b0] text-sm font-bold border-2 border-white/[0.12]">
                  {top3[2].nomeUsuario.charAt(0)}
                </div>
                <span className="text-[10px] text-[#a8e6b0] font-medium mt-1">{top3[2].nomeUsuario.split(' ')[0]}</span>
                <span className="text-[10px] text-[#a8e6b0]/70 font-bold">{top3[2].pontuacaoTotal} pts</span>
              </div>
            </div>
          )}

          {/* Lista 4+ */}
          {restoRanking.length > 0 && (
            <div className="space-y-1">
              {(rankingExpandido ? restoRanking : restoRanking.slice(0, 5)).map((item) => {
                const variacao = obterVariacao(item.usuarioId);
                return (
                  <div key={item.usuarioId} className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-white/[0.02]">
                    <span className="text-[11px] text-[#a8e6b0]/40 font-medium w-4 text-center">{item.posicao}</span>
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#009c3b]/20 text-[#ffdf00] text-[10px] font-bold">
                      {item.nomeUsuario.charAt(0)}
                    </div>
                    <span className="flex-1 text-sm text-[#a8e6b0]">{item.nomeUsuario}</span>
                    <span className="text-sm text-[#ffdf00]/70 font-medium">{item.pontuacaoTotal} pts</span>
                    <span className="w-6 text-center">
                      {variacao > 0 && <span className="text-[10px] text-[#22c55e] font-bold">↑{variacao}</span>}
                      {variacao < 0 && <span className="text-[10px] text-erro font-bold">↓{Math.abs(variacao)}</span>}
                      {variacao === 0 && <Minus size={10} className="text-[#a8e6b0]/20 inline" />}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {(!rankingGeral || rankingGeral.length === 0) && !carregandoRanking && (
            <p className="text-[11px] text-[#a8e6b0]/40 text-center py-4">Nenhuma pontuação registrada ainda</p>
          )}
          {(!rankingGeral || rankingGeral.length === 0) && carregandoRanking && (
            <div className="space-y-2 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 rounded-lg bg-[#009c3b]/10 animate-pulse" />
              ))}
            </div>
          )}

          {restoRanking.length > 5 && (
            <button
              onClick={() => setRankingExpandido(!rankingExpandido)}
              className="w-full flex items-center justify-center gap-1 mt-3 pt-3 border-t border-[#009c3b]/20 text-[11px] text-[#ffdf00]/70 hover:text-[#ffdf00]"
            >
              {rankingExpandido ? 'Ver menos' : 'Ver todos'} <ChevronRight size={10} className={rankingExpandido ? 'rotate-90' : ''} />
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
