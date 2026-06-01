'use client';

import { useState } from 'react';
import { usePalpitesData } from '@/hooks/usePalpitesData';
import { AbaTodosJogos } from '@/components/palpites/aba-todos-jogos';
import { AbaMeusPalpites } from '@/components/palpites/aba-meus-palpites';
import { IconPalpite } from '@/components/icons/icon-palpite';

export default function PalpitesPage() {
  const [abaAtiva, setAbaAtiva] = useState<'todos' | 'meus'>('todos');
  const [cardAtivo, setCardAtivo] = useState<string | null>(null);

  const {
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
  } = usePalpitesData(abaAtiva);

  if (!temporadaId) {
    return (
      <div className="min-h-screen bg-fundo flex items-center justify-center pb-20">
        <p className="text-texto/40 text-sm">Entre em um grupo para ver os palpites</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fundo pb-36">
      {/* Header */}
      <header className="sticky top-0 z-20 px-4 pt-4 pb-3 bg-fundo/95 backdrop-blur-lg border-b border-white/[0.05]">
        <div className="mx-auto max-w-[480px]">
          <div className="flex items-center gap-2 mb-1">
            <IconPalpite size={22} className="text-primaria-claro" />
            <h1 className="text-lg font-bold text-texto">Palpites</h1>
          </div>
          <p className="text-[10px] text-texto/30">Mostre que você entende de futebol!</p>
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
        {!isLoading && !(carregandoBatch && !palpitesBatch) && abaAtiva === 'todos' && (
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
