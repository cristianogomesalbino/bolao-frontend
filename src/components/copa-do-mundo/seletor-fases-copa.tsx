'use client';

import { useState } from 'react';
import { Fase } from '@/types/jogo.types';

interface PropsSeletorFasesCopa {
  fases: Fase[];
  faseSelecionada: Fase | null;
  onSelecionar: (fase: Fase) => void;
}

const ICONES_FASE: Record<string, string> = {
  'Fase de Grupos': '⚽',
  '32 Avos de Final': '🏆',
  'Oitavas de Final': '🏆',
  'Quartas de Final': '🏆',
  Semifinais: '🏆',
  'Disputa 3º Lugar': '🥉',
  Final: '🏆',
};

export function SeletorFasesCopa({ fases, faseSelecionada, onSelecionar }: Readonly<PropsSeletorFasesCopa>) {
  const [expandido, setExpandido] = useState(false);

  // Separar fases de grupos das eliminatórias
  const fasesGrupos = fases.filter((f) => f.tipo === 'PONTOS_CORRIDOS');
  const fasesEliminatorias = fases.filter((f) => f.tipo === 'MATA_MATA');

  return (
    <div className="space-y-2">
      {/* Tabs principais: Grupos | Eliminatórias */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
        <button
          type="button"
          onClick={() => setExpandido(false)}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            expandido
              ? 'text-texto/50 hover:text-texto/70'
              : 'bg-primaria/20 text-primaria-claro border border-primaria/30'
          }`}
        >
          ⚽ Grupos
        </button>
        <button
          type="button"
          onClick={() => setExpandido(true)}
          className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
            expandido
              ? 'bg-destaque/20 text-destaque border border-destaque/30'
              : 'text-texto/50 hover:text-texto/70'
          }`}
        >
          🏆 Eliminatórias
        </button>
      </div>

      {/* Grid de fases */}
      {expandido ? (
        <div className="space-y-1.5">
          {fasesEliminatorias.map((fase) => {
            const icone = ICONES_FASE[fase.nome] || '🏆';
            return (
              <button
                key={fase.id}
                type="button"
                onClick={() => onSelecionar(fase)}
                className={`w-full flex items-center gap-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all ${
                  faseSelecionada?.id === fase.id
                    ? 'bg-destaque/15 text-destaque border border-destaque/30'
                    : 'bg-white/[0.03] text-texto/60 border border-white/[0.06] hover:bg-white/[0.06]'
                }`}
              >
                <span>{icone}</span>
                <span>{fase.nome}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-1.5">
          {fasesGrupos.map((fase) => (
            <button
              key={fase.id}
              type="button"
              onClick={() => onSelecionar(fase)}
              className={`py-2 px-1 rounded-lg text-[10px] font-semibold transition-all text-center ${
                faseSelecionada?.id === fase.id
                  ? 'bg-primaria/20 text-primaria-claro border border-primaria/40'
                  : 'bg-white/[0.03] text-texto/60 border border-white/[0.06] hover:bg-white/[0.06]'
              }`}
            >
              {fase.nome.replace('Fase de Grupos - ', '')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
