import { marcarTourCompleto } from '@/services/tour.service';
import type { TourId } from '@/types/tour.types';
import { TOURS_VALIDOS } from '@/types/tour.types';

const STORAGE_KEY = 'tours-pendentes';

function isTourIdValido(value: string): value is TourId {
  return (TOURS_VALIDOS as readonly string[]).includes(value);
}

export async function sincronizarToursPendentes(): Promise<void> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    const pendentes: string[] = JSON.parse(raw) as string[];
    if (pendentes.length === 0) return;

    const sucessos: string[] = [];

    for (const tourId of pendentes) {
      if (!isTourIdValido(tourId)) continue;

      try {
        await marcarTourCompleto(tourId);
        sucessos.push(tourId);
      } catch {
        // falha individual — deixa pra próxima
      }
    }

    const restantes = pendentes.filter((id) => !sucessos.includes(id));

    if (restantes.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(restantes));
    }
  } catch {
    // localStorage indisponível — ignora
  }
}
