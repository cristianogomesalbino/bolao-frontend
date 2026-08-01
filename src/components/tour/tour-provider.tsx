'use client';

import { useEffect, useState, useCallback } from 'react';
import { Joyride, EVENTS } from 'react-joyride';
import type { EventData, Controls } from 'react-joyride';
import { TooltipTour } from './tooltip-tour';
import { useAuthStore } from '@/stores/auth.store';
import { marcarTourCompleto } from '@/services/tour.service';
import type { TourId, StepTour } from '@/types/tour.types';

interface PropsTourProvider {
  tourId: TourId;
  steps: StepTour[];
}

const STORAGE_KEY = 'tours-pendentes';

export function TourProvider({ tourId, steps }: Readonly<PropsTourProvider>) {
  const usuario = useAuthStore((state) => state.usuario);
  const atualizarUsuario = useAuthStore((state) => state.atualizarUsuario);

  const [run, setRun] = useState(false);

  useEffect(() => {
    if (!usuario) return;
    const completos = usuario.toursCompletos ?? [];
    if (completos.includes(tourId)) return;

    const timer = setTimeout(() => {
      setRun(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [usuario, tourId]);

  const persistirCompleto = useCallback((id: TourId) => {
    const atuais = usuario?.toursCompletos ?? [];
    if (!atuais.includes(id)) {
      atualizarUsuario({ toursCompletos: [...atuais, id] });
    }
    marcarTourCompleto(id).catch(() => {
      try {
        const pendentes: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]') as string[];
        if (!pendentes.includes(id)) {
          pendentes.push(id);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(pendentes));
        }
      } catch { /* ignore */ }
    });
  }, [usuario?.toursCompletos, atualizarUsuario]);

  const handleEvent = useCallback((data: EventData, _controls: Controls) => {
    if (data.type === EVENTS.TOUR_END) {
      setRun(false);
      persistirCompleto(tourId);
    }
  }, [tourId, persistirCompleto]);

  const joyrideSteps = steps.map((step) => ({
    target: step.target,
    title: step.titulo,
    content: step.conteudo,
    placement: step.placement ?? ('auto' as const),
    skipBeacon: true,
  }));

  if (!run) return null;

  return (
    <Joyride
      steps={joyrideSteps}
      run
      continuous
      onEvent={handleEvent}
      tooltipComponent={TooltipTour}
      styles={{
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        },
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
