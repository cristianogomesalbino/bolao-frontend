'use client';

import { useEffect, useState, useCallback } from 'react';
import { Joyride, EVENTS } from 'react-joyride';
import type { EventData, Controls } from 'react-joyride';
import { TooltipTour } from './tooltip-tour';
import { useAuthStore } from '@/stores/auth.store';
import { marcarTourCompleto } from '@/services/tour.service';
import { salvarTourPendente } from '@/lib/tour-sync';
import type { TourId, StepTour } from '@/types/tour.types';

interface PropsTourProvider {
  tourId: TourId;
  steps: StepTour[];
}

export function TourProvider({ tourId, steps }: Readonly<PropsTourProvider>) {
  const usuario = useAuthStore((state) => state.usuario);

  const [run, setRun] = useState(false);

  // Escuta evento de refazer tour
  useEffect(() => {
    function handleRefazer(e: Event) {
      const detail = (e as CustomEvent).detail;
      if (detail?.tourId === tourId) {
        setRun(true);
      }
    }
    window.addEventListener('refazer-tour', handleRefazer);
    return () => window.removeEventListener('refazer-tour', handleRefazer);
  }, [tourId]);

  useEffect(() => {
    if (!usuario) return;
    const completos = usuario.toursCompletos ?? [];
    if (completos.includes(tourId)) return;

    const primeiroTarget = steps[0]?.target;
    if (!primeiroTarget) return;

    let tentativas = 0;
    const maxTentativas = 20;

    const intervalo = setInterval(() => {
      tentativas++;
      const elemento = document.querySelector(primeiroTarget);
      if (elemento) {
        clearInterval(intervalo);
        setRun(true);
      } else if (tentativas >= maxTentativas) {
        clearInterval(intervalo);
      }
    }, 300);

    return () => clearInterval(intervalo);
  }, [usuario, tourId, steps]);

  const persistirCompleto = useCallback((id: TourId) => {
    const state = useAuthStore.getState();
    const atuais = state.usuario?.toursCompletos ?? [];
    if (!atuais.includes(id)) {
      state.atualizarUsuario({ toursCompletos: [...atuais, id] });
    }
    marcarTourCompleto(id).catch(() => {
      salvarTourPendente(id);
    });
  }, []);

  const handleEvent = useCallback((data: EventData, _controls: Controls) => {
    if (data.type === EVENTS.TOUR_END) {
      setRun(false);
      persistirCompleto(tourId);
      return;
    }

    const isTooltipStep = data.type === EVENTS.TOOLTIP;
    const stepTarget = steps[data.index ?? 0]?.target;
    const shouldAutoClick = isTooltipStep && stepTarget === '[data-tour="aba-meus-palpites"]';

    if (!shouldAutoClick) return;

    const el = document.querySelector('[data-tour="aba-meus-palpites"]') as HTMLButtonElement | null;
    el?.click();
  }, [tourId, persistirCompleto, steps]);

  const joyrideSteps = steps.map((step) => ({
    target: step.target,
    title: step.titulo,
    content: step.conteudo,
    placement: step.placement ?? ('auto' as const),
    skipBeacon: true,
    blockTargetInteraction: false,
    overlayColor: 'rgba(0, 0, 0, 0.6)',
    spotlightRadius: 8,
  }));

  return (
    <Joyride
      steps={joyrideSteps}
      run={run}
      continuous
      scrollToFirstStep
      onEvent={handleEvent}
      tooltipComponent={TooltipTour}
      options={{
        overlayColor: 'rgba(0, 0, 0, 0.6)',
        spotlightRadius: 8,
        scrollOffset: 200,
        scrollDuration: 300,
      }}
      styles={{
        tooltip: {
          backgroundColor: 'transparent',
          padding: 0,
          borderRadius: 0,
          boxShadow: 'none',
        },
        tooltipContainer: {
          textAlign: 'left' as const,
        },
      }}
    />
  );
}
