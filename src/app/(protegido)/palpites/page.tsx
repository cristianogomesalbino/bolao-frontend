'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';
import { listarFases, listarJogosFase } from '@/services/jogo.service';
import { buscarClassificacao } from '@/services/classificacao.service';
import { buscarMeusPalpitesPorJogos } from '@/services/palpite.service';
import { Jogo } from '@/types/jogo.types';
import { CardJogoPalpite } from '@/components/jogos/card-jogo-palpite';
import { IconPalpite } from '@/components/icons/icon-palpite';

export default function PalpitesPage() {
  const [abaAtiva, setAbaAtiva] = useState<'todos' | 'meus' | 'ao-vivo'>('todos');

  // Buscar temporadaId do primeiro grupo do usuário
  const { data: gruposData } = useQuery({
    queryKey: ['grupos-palpites'],
    queryFn: async () => {
      const { default: apiClient } = await import('@/lib/api-client');
      const response = await apiClient.get('/grupos', { params: { membro: true } });
      return response.data as Array<{ id: string; temporadaId: string }>;
    },
  });

  const temporadaId = gruposData?.[0]?.temporadaId || '';
  const grupoId = gruposData?.[0]?.id || '';

  const { data: fases } = useQuery({
    queryKey: ['fases', temporadaId],
    queryFn: () => listarFases(temporadaId),
    enabled: !!temporadaId,
  });

  const faseAtual = fases?.[0];

  // Buscar rodada atual (sem parâmetro = rodada atual)
  const { data: jogosRodadaAtual, isLoading } = useQuery({
    queryKey: ['jogos-rodada-atual', faseAtual?.id],
    queryFn: () => listarJogosFase(faseAtual!.id),
    enabled: !!faseAtual?.id,
  });

  // Buscar próxima rodada
  const rodadaAtual = jogosRodadaAtual?.rodadaAtual ?? null;
  const proximaRodada = rodadaAtual ? rodadaAtual + 1 : null;

  const { data: jogosProximaRodada } = useQuery({
    queryKey: ['jogos-proxima-rodada', faseAtual?.id, proximaRodada],
    queryFn: () => listarJogosFase(faseAtual!.id, proximaRodada!),
    enabled: !!faseAtual?.id && !!proximaRodada && proximaRodada <= 38,
  });

  const { data: classificacao } = useQuery({
    queryKey: ['classificacao'],
    queryFn: () => buscarClassificacao(),
    staleTime: 1000 * 60 * 60,
  });

  const jogosAtual = jogosRodadaAtual?.jogos ?? [];
  const jogosProxima = jogosProximaRodada?.jogos ?? [];

  // Filtrar jogos relevantes e colocar palpitáveis no topo
  const jogosAtualVisiveis = jogosAtual
    .filter(
      (j: Jogo) => j.status === 'AGENDADO' || j.status === 'EM_ANDAMENTO' || j.status === 'FINALIZADO'
    )
    .sort((a: Jogo, b: Jogo) => {
      const palpitavelA = a.status === 'AGENDADO';
      const palpitavelB = b.status === 'AGENDADO';
      if (palpitavelA && !palpitavelB) return -1;
      if (!palpitavelA && palpitavelB) return 1;
      return 0;
    });
  const jogosProximaVisiveis = jogosProxima.filter(
    (j: Jogo) => j.status === 'AGENDADO' || j.status === 'EM_ANDAMENTO'
  );

  // Buscar todos os palpites do usuário de uma vez e popular cache individual
  const todosJogoIds = [...jogosAtualVisiveis, ...jogosProximaVisiveis].map((j) => j.id);
  const queryClient = useQueryClient();

  useQuery({
    queryKey: ['meus-palpites-batch', faseAtual?.id, rodadaAtual],
    queryFn: async () => {
      const palpites = await buscarMeusPalpitesPorJogos(todosJogoIds);
      const palpitesPorJogo = new Map(palpites.map((p) => [p.jogoId, p]));
      for (const jogoId of todosJogoIds) {
        queryClient.setQueryData(['meu-palpite', jogoId], palpitesPorJogo.get(jogoId) ?? null);
      }
      return palpites;
    },
    enabled: jogosAtualVisiveis.length > 0 && !isLoading,
    staleTime: Infinity,
  });

  // Contadores
  const totalJogos = jogosAtualVisiveis.length;
  const jogosComPalpite = 0; // TODO: contar palpites feitos

  if (!temporadaId) {
    return (
      <div className="min-h-screen bg-fundo flex items-center justify-center pb-20">
        <p className="text-texto/40 text-sm">Entre em um grupo para ver os palpites</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fundo pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 bg-fundo/90 backdrop-blur-lg border-b border-white/[0.05]">
        <div className="mx-auto max-w-[480px]">
          <div className="flex items-center gap-2 mb-1">
            <IconPalpite size={22} className="text-primaria-claro" />
            <h1 className="text-lg font-bold text-texto">Palpites</h1>
          </div>
          <p className="text-[10px] text-texto/30">Mostre que você entende de futebol!</p>
        </div>
      </header>

      <div className="mx-auto max-w-[480px] px-4 pt-3">
        {/* Card da rodada */}
        {rodadaAtual && (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-texto">RODADA {rodadaAtual}</span>
                <ChevronDown size={14} className="text-texto/40" />
              </div>
              {jogosAtualVisiveis.some((j: Jogo) => j.status === 'EM_ANDAMENTO') && (
                <span className="text-[9px] font-bold text-primaria bg-primaria/15 border border-primaria/30 px-2 py-0.5 rounded">
                  Em andamento
                </span>
              )}
              {!jogosAtualVisiveis.some((j: Jogo) => j.status === 'EM_ANDAMENTO') && (
                <span className="text-[9px] font-bold text-texto/40 bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded">
                  Agendada
                </span>
              )}
            </div>

            {/* Progresso de palpites */}
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-texto/40">{jogosComPalpite} / {totalJogos} palpites feitos</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primaria to-primaria-claro transition-all"
                  style={{ width: totalJogos > 0 ? `${(jogosComPalpite / totalJogos) * 100}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Abas */}
        <div className="flex items-center gap-0 border-b border-white/[0.06] mb-4">
          <button
            onClick={() => setAbaAtiva('todos')}
            className={`flex-1 py-2.5 text-[11px] font-semibold text-center border-b-2 transition-colors ${
              abaAtiva === 'todos'
                ? 'text-texto border-primaria-claro'
                : 'text-texto/40 border-transparent'
            }`}
          >
            Todos os jogos
          </button>
          <button
            onClick={() => setAbaAtiva('meus')}
            className={`flex-1 py-2.5 text-[11px] font-semibold text-center border-b-2 transition-colors ${
              abaAtiva === 'meus'
                ? 'text-texto border-primaria-claro'
                : 'text-texto/40 border-transparent'
            }`}
          >
            Meus palpites
          </button>
          <button
            onClick={() => setAbaAtiva('ao-vivo')}
            className={`flex-1 py-2.5 text-[11px] font-semibold text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
              abaAtiva === 'ao-vivo'
                ? 'text-texto border-primaria-claro'
                : 'text-texto/40 border-transparent'
            }`}
          >
            Ao vivo
            {jogosAtualVisiveis.some((j: Jogo) => j.status === 'EM_ANDAMENTO') && (
              <span className="h-2 w-2 rounded-full bg-erro animate-pulse" />
            )}
          </button>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[120px] rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
            ))}
          </div>
        )}

        {/* Conteúdo da aba "Todos os jogos" */}
        {!isLoading && abaAtiva === 'todos' && (
          <div className="space-y-4">
            {/* Rodada atual */}
            {jogosAtualVisiveis.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-px flex-1 bg-white/[0.06]" />
                  <span className="text-[11px] text-texto/80 font-semibold uppercase tracking-wider">
                    Rodada {rodadaAtual}
                  </span>
                  <span className="h-px flex-1 bg-white/[0.06]" />
                </div>
                <div className="space-y-2">
                  {jogosAtualVisiveis.map((jogo: Jogo) => (
                    <CardJogoPalpite
                      key={jogo.id}
                      jogo={jogo}
                      classificacao={classificacao}
                      palpitavel={jogo.status === 'AGENDADO' || jogo.status === 'ADIADO'}
                      grupoId={grupoId}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Próxima rodada */}
            {jogosProximaVisiveis.length > 0 && proximaRodada && (
              <div>
                <div className="flex items-center gap-2 mb-3 mt-4">
                  <span className="h-px flex-1 bg-white/[0.06]" />
                  <span className="text-[11px] text-texto/80 font-semibold uppercase tracking-wider">
                    Rodada {proximaRodada}
                  </span>
                  <span className="h-px flex-1 bg-white/[0.06]" />
                </div>
                <div className="space-y-2">
                  {jogosProximaVisiveis.map((jogo: Jogo) => (
                    <CardJogoPalpite
                      key={jogo.id}
                      jogo={jogo}
                      classificacao={classificacao}
                      palpitavel={jogo.status === 'AGENDADO' || jogo.status === 'ADIADO'}
                      grupoId={grupoId}
                    />
                  ))}
                </div>
              </div>
            )}

            {jogosAtualVisiveis.length === 0 && jogosProximaVisiveis.length === 0 && (
              <div className="flex flex-col items-center py-12 text-center">
                <IconPalpite size={32} className="text-texto/15 mb-3" />
                <p className="text-texto/40 text-sm">Nenhum jogo disponível</p>
              </div>
            )}
          </div>
        )}

        {/* Aba "Ao vivo" */}
        {!isLoading && abaAtiva === 'ao-vivo' && (
          <div className="space-y-2">
            {jogosAtualVisiveis.filter((j: Jogo) => j.status === 'EM_ANDAMENTO').length > 0 ? (
              jogosAtualVisiveis
                .filter((j: Jogo) => j.status === 'EM_ANDAMENTO')
                .map((jogo: Jogo) => (
                  <CardJogoPalpite key={jogo.id} jogo={jogo} classificacao={classificacao} grupoId={grupoId} />
                ))
            ) : (
              <div className="flex flex-col items-center py-12 text-center">
                <span className="text-3xl mb-3">⚽</span>
                <p className="text-texto/40 text-sm">Nenhum jogo ao vivo agora</p>
              </div>
            )}
          </div>
        )}

        {/* Aba "Meus palpites" */}
        {!isLoading && abaAtiva === 'meus' && (
          <div className="flex flex-col items-center py-12 text-center">
            <IconPalpite size={32} className="text-texto/15 mb-3" />
            <p className="text-texto/40 text-sm">Em breve</p>
            <p className="text-texto/25 text-[10px] mt-1">Histórico dos seus palpites</p>
          </div>
        )}
      </div>
    </div>
  );
}
