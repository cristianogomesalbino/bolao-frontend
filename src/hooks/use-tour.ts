'use client';

import { useState, useCallback, useEffect } from 'react';
import { STATUS, type CallBackProps } from 'react-joyride';
import { useAuthStore } from '@/stores/auth.store';
import { marcarTourCompleto } from '@/services/tour.service';
import type { TourId, StepTour } from '@/types/tour.types';

interface UseTourOptions {
  tourId: TourId;
  steps: StepTour[];
}

interface UseTourRetorno {
  tourAtivo: boolean;
  steps: StepTour[];
  stepAtual: number;
  aguardando: boolean;
  handleCallback: (data: CallBackProps) => void;
  iniciarTour: () => void;
  avancar: () => void;
  retroceder: () => void;
  encerrar: () => void;
}

const STORAGE_KEY = 'tours-pendentes';

function salvarPendente(tourId: TourId): void {
  try {
    const pendentes: string[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? '[]',
    ) as string[];
    if (!pendentes.includes(tourId)) {
      pendentes.push(tourId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pendentes));
    }
  } catch {
    // localStorage indisponível — ignora
  }
}

export function useTour({ tourId, steps }: UseTourOptions): UseTourRetorno {
  const usuario = useAuthStore((state) => state.usuario);
  const atualizarUsuario = useAuthStore((state) => state.atualizarUsuario);

  const [tourAtivo, setTourAtivo] = useState(false);
  const [stepAtual, setStepAtual] = useState(0);

  const toursCompletos = usuario?.toursCompletos;
  const aguardando = usuario === null || usuario === undefined;

  // Auto-ativar tour se não foi completado
  useEffect(() => {
    if (aguardando) return;
    const completos = toursCompletos ?? [];
    if (!completos.includes(tourId)) {
      setTourAtivo(true);
      setStepAtual(0);
    }
  }, [aguardando, toursCompletos, tourId]);

  const persistirCompleto = useCallback(
    (id: TourId) => {
      // Atualizar store local imediatamente
      const atuais = usuario?.toursCompletos ?? [];
      if (!atuais.includes(id)) {
        atualizarUsuario({ toursCompletos: [...atuais, id] });
      }

      // Persistir no backend (fire-and-forget)
      marcarTourCompleto(id).catch(() => {
        salvarPendente(id);
      });
    },
    [usuario?.toursCompletos, atualizarUsuario],
  );

  const encerrar = useCallback(() => {
    setTourAtivo(false);
  }, []);

  const iniciarTour = useCallback(() => {
    setStepAtual(0);
    setTourAtivo(true);
  }, []);

  const avancar = useCallback(() => {
    setStepAtual((prev) => Math.min(prev + 1, steps.length - 1));
  }, [steps.length]);

  const retroceder = useCallback(() => {
    setStepAtual((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleCallback = useCallback(
    (data: CallBackProps) => {
      const { status } = data;

      if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
        setTourAtivo(false);
        persistirCompleto(tourId);
      }
    },
    [tourId, persistirCompleto],
  );

  return {
    tourAtivo,
    steps,
    stepAtual,
    aguardando,
    handleCallback,
    iniciarTour,
    avancar,
    retroceder,
    encerrar,
  };
}
