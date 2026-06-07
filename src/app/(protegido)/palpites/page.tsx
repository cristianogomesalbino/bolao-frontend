'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { usePalpitesData } from '@/hooks/usePalpitesData';
import { AbaTodosJogos } from '@/components/palpites/aba-todos-jogos';
import { AbaMeusPalpites } from '@/components/palpites/aba-meus-palpites';
import { AbaJogosCopa } from '@/components/palpites/aba-jogos-copa';
import { IconPalpite } from '@/components/icons/icon-palpite';
import { type CampeonatoSlug } from '@/types/jogo.types';

const SLUGS_VALIDOS = new Set<CampeonatoSlug>(['brasileirao', 'copa-do-mundo-2026']);

export default function PalpitesPage() {
  const searchParams = useSearchParams();
  const paramCampeonato = searchParams.get('campeonato');
  const campeonatoInicial: CampeonatoSlug = SLUGS_VALIDOS.has(paramCampeonato as CampeonatoSlug)
    ? (paramCampeonato as CampeonatoSlug)
    : 'brasileirao';
  const [abaAtiva, setAbaAtiva] = useState<'todos' | 'meus'>('todos');
  const [cardAtivo, setCardAtivo] = useState<string | null>(null);
  const [campeonato, setCampeonato] = useState<CampeonatoSlug>(campeonatoInicial);

  const {
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
  } = usePalpitesData(abaAtiva, campeonato);

  if (!temporadaId) {
    return (
      <div className={`min-h-screen flex items-center justify-center pb-20 ${campeonato === 'copa-do-mundo-2026' ? 'bg-[#003d1a]' : 'bg-fundo'}`}>
        <p className="text-texto/40 text-sm">Carregando...</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-36 relative ${ehCopaMundo ? 'bg-[#003d1a]' : 'bg-fundo'}`}>
      {/* Fundo temático Copa */}
      {ehCopaMundo && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-40px] left-[10%] w-[500px] h-[300px] rounded-full bg-[#00b340]/25 blur-[120px]" />
          <div className="absolute top-[20px] right-[5%] w-[400px] h-[250px] rounded-full bg-[#ffdf00]/12 blur-[90px]" />
          <div className="absolute top-[40%] left-[-10%] w-[120%] h-[180px] bg-[#ffdf00]/[0.04] rotate-[-3deg] blur-[40px]" />
          <div className="absolute bottom-[0px] left-[15%] w-[500px] h-[300px] rounded-full bg-[#00b340]/20 blur-[120px]" />
          <div className="absolute bottom-[50px] right-[10%] w-[400px] h-[250px] rounded-full bg-[#ffdf00]/10 blur-[100px]" />
        </div>
      )}
      {/* Header */}
      <header className={`sticky top-0 z-20 px-4 pt-4 pb-3 backdrop-blur-lg border-b ${ehCopaMundo ? 'bg-[#003d1a]/90 border-[#009c3b]/30' : 'bg-fundo/95 border-white/[0.05]'}`}>
        <div className="mx-auto max-w-[480px]">
          <div className="flex items-center gap-2 mb-2">
            <IconPalpite size={22} className="text-primaria-claro" />
            <h1 className="text-lg font-bold text-texto">Palpites</h1>
          </div>
          {/* Seletor de campeonato */}
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setCampeonato('brasileirao')}
              className={`flex-1 py-2 px-2 rounded-lg text-[11px] font-semibold transition-all text-center ${
                campeonato === 'brasileirao'
                  ? 'bg-primaria/20 text-primaria-claro border border-primaria/30'
                  : 'bg-white/[0.03] text-texto/40 border border-white/[0.06]'
              }`}
            >
              ⚽ Brasileirão
            </button>
            <button
              type="button"
              onClick={() => setCampeonato('copa-do-mundo-2026')}
              className={`flex-1 py-2 px-2 rounded-lg text-[11px] font-semibold transition-all text-center ${
                campeonato === 'copa-do-mundo-2026'
                  ? 'bg-[#009c3b]/20 text-[#ffdf00] border border-[#009c3b]/40'
                  : 'bg-white/[0.03] text-texto/40 border border-white/[0.06]'
              }`}
            >
              🏆 Copa do Mundo
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[480px] px-4 pt-3">
        {/* Abas */}
        <div className="flex items-center gap-0 border-b border-white/[0.06] mb-4">
          <button
            onClick={() => setAbaAtiva('todos')}
            className={`flex-1 py-2.5 text-[11px] font-semibold text-center border-b-2 transition-colors ${
              abaAtiva === 'todos' ? 'text-texto border-primaria-claro' : 'text-texto/40 border-transparent'
            }`}
          >
            Todos os jogos
          </button>
          <button
            onClick={() => setAbaAtiva('meus')}
            className={`flex-1 py-2.5 text-[11px] font-semibold text-center border-b-2 transition-colors ${
              abaAtiva === 'meus' ? 'text-texto border-primaria-claro' : 'text-texto/40 border-transparent'
            }`}
          >
            Meus palpites
          </button>
        </div>

        {/* Loading */}
        {(isLoading || (carregandoBatch && !palpitesBatch)) && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[120px] rounded-xl bg-white/[0.03] border border-white/[0.06] animate-pulse" />
            ))}
          </div>
        )}

        {/* Aba "Todos os jogos" */}
        {!isLoading && !(carregandoBatch && !palpitesBatch) && abaAtiva === 'todos' && ehCopaMundo && fases && fases.length > 0 && (
          <AbaJogosCopa
            fases={fases}
            grupoId={grupoId}
            temporadaId={temporadaId}
            cardAtivo={cardAtivo}
            onFoco={setCardAtivo}
          />
        )}

        {!isLoading && !(carregandoBatch && !palpitesBatch) && abaAtiva === 'todos' && !ehCopaMundo && (
          <AbaTodosJogos
            jogosAtualVisiveis={jogosAtualVisiveis}
            jogosProximaVisiveis={jogosProximaVisiveis}
            palpitesPorJogo={palpitesPorJogo}
            grupoId={grupoId}
            rodadaAtual={rodadaAtual}
            proximaRodada={proximaRodada}
            carregandoProxima={carregandoProxima}
            faseAtual={faseAtual}
            cardAtivo={cardAtivo}
            onFoco={setCardAtivo}
          />
        )}

        {/* Aba "Meus palpites" */}
        {!isLoading && abaAtiva === 'meus' && (
          <AbaMeusPalpites
            palpitesFinalizados={palpitesFinalizados}
            palpitesPorRodada={palpitesPorRodada}
            carregandoPalpites={carregandoPalpites}
            buscandoPalpites={buscandoPalpites}
            temporadaId={temporadaId}
          />
        )}
      </div>
    </div>
  );
}
