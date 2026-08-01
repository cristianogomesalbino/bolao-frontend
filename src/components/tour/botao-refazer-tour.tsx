'use client';

import { useState, useRef, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';
import type { TourId, ConfiguracaoTour } from '@/types/tour.types';

interface PropsBotaoRefazerTour {
  toursDisponiveis: ConfiguracaoTour[];
  onIniciarTour: (tourId: TourId) => void;
}

export function BotaoRefazerTour({
  toursDisponiveis,
  onIniciarTour,
}: Readonly<PropsBotaoRefazerTour>) {
  const [menuAberto, setMenuAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickFora(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setMenuAberto(false);
      }
    }

    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  const desabilitado = toursDisponiveis.length === 0;

  function handleClick() {
    if (desabilitado) return;

    if (toursDisponiveis.length === 1) {
      onIniciarTour(toursDisponiveis[0].id);
      return;
    }

    setMenuAberto((prev) => !prev);
  }

  function handleSelecionarTour(tourId: TourId) {
    setMenuAberto(false);
    onIniciarTour(tourId);
  }

  return (
    <div ref={ref} className="relative" data-tour="botao-refazer-tour">
      <button
        onClick={handleClick}
        disabled={desabilitado}
        aria-label="Refazer tour de ajuda"
        title="Refazer tour"
        className={`p-2 rounded-xl transition-colors ${
          desabilitado
            ? 'opacity-50 cursor-not-allowed text-texto/30'
            : 'text-texto/60 hover:text-texto hover:bg-white/[0.06]'
        }`}
      >
        <HelpCircle size={20} />
      </button>

      {menuAberto && toursDisponiveis.length > 1 && (
        <div className="absolute right-0 top-full mt-2 z-50 min-w-[180px] py-1 bg-white/[0.04] backdrop-blur-2xl border border-white/[0.12] rounded-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)] animate-[fadeIn_0.15s_ease-out]">
          {toursDisponiveis.map((tour) => (
            <button
              key={tour.id}
              onClick={() => handleSelecionarTour(tour.id)}
              className="w-full text-left px-4 py-2.5 text-sm text-texto/80 hover:bg-white/[0.06] hover:text-texto transition-colors"
            >
              {tour.nome}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
