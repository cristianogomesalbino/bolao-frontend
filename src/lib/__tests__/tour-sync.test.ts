import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  salvarTourPendente,
  sincronizarToursPendentes,
  TOUR_STORAGE_KEY,
} from '../tour-sync';

// Mock do tour.service para evitar chamadas HTTP reais
vi.mock('@/services/tour.service', () => ({
  marcarTourCompleto: vi.fn(),
}));

import { marcarTourCompleto } from '@/services/tour.service';
const marcarTourCompletoMock = vi.mocked(marcarTourCompleto);

// Mock simples de localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('tour-sync', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('salvarTourPendente', () => {
    it('salva tourId no localStorage quando não existe', () => {
      salvarTourPendente('tour-palpites');

      const pendentes = JSON.parse(localStorageMock.getItem(TOUR_STORAGE_KEY) ?? '[]') as string[];
      expect(pendentes).toContain('tour-palpites');
    });

    it('não duplica tourId já presente', () => {
      salvarTourPendente('tour-palpites');
      salvarTourPendente('tour-palpites');

      const pendentes = JSON.parse(localStorageMock.getItem(TOUR_STORAGE_KEY) ?? '[]') as string[];
      expect(pendentes.filter((id) => id === 'tour-palpites')).toHaveLength(1);
    });

    it('acumula múltiplos tourIds diferentes', () => {
      salvarTourPendente('tour-palpites');
      salvarTourPendente('tour-grupo');

      const pendentes = JSON.parse(localStorageMock.getItem(TOUR_STORAGE_KEY) ?? '[]') as string[];
      expect(pendentes).toContain('tour-palpites');
      expect(pendentes).toContain('tour-grupo');
      expect(pendentes).toHaveLength(2);
    });
  });

  describe('sincronizarToursPendentes', () => {
    it('não faz nada quando não há pendentes', async () => {
      await sincronizarToursPendentes();
      expect(marcarTourCompletoMock).not.toHaveBeenCalled();
    });

    it('não faz nada quando localStorage está vazio', async () => {
      localStorageMock.setItem(TOUR_STORAGE_KEY, '[]');
      await sincronizarToursPendentes();
      expect(marcarTourCompletoMock).not.toHaveBeenCalled();
    });

    it('envia tours pendentes válidos ao backend', async () => {
      marcarTourCompletoMock.mockResolvedValue(undefined);
      localStorageMock.setItem(TOUR_STORAGE_KEY, JSON.stringify(['tour-palpites', 'tour-grupo']));

      await sincronizarToursPendentes();

      expect(marcarTourCompletoMock).toHaveBeenCalledWith('tour-palpites');
      expect(marcarTourCompletoMock).toHaveBeenCalledWith('tour-grupo');
    });

    it('remove todos do localStorage após sincronização bem-sucedida', async () => {
      marcarTourCompletoMock.mockResolvedValue(undefined);
      localStorageMock.setItem(TOUR_STORAGE_KEY, JSON.stringify(['tour-palpites']));

      await sincronizarToursPendentes();

      expect(localStorageMock.getItem(TOUR_STORAGE_KEY)).toBeNull();
    });

    it('ignora tourIds inválidos (não está em TOURS_VALIDOS)', async () => {
      localStorageMock.setItem(TOUR_STORAGE_KEY, JSON.stringify(['tour-invalido']));

      await sincronizarToursPendentes();

      expect(marcarTourCompletoMock).not.toHaveBeenCalled();
    });

    it('mantém no localStorage tours que falharam ao sincronizar', async () => {
      marcarTourCompletoMock
        .mockResolvedValueOnce(undefined)    // tour-palpites — sucesso
        .mockRejectedValueOnce(new Error()); // tour-grupo — falha

      localStorageMock.setItem(
        TOUR_STORAGE_KEY,
        JSON.stringify(['tour-palpites', 'tour-grupo']),
      );

      await sincronizarToursPendentes();

      const restantes = JSON.parse(localStorageMock.getItem(TOUR_STORAGE_KEY) ?? '[]') as string[];
      expect(restantes).not.toContain('tour-palpites');
      expect(restantes).toContain('tour-grupo');
    });
  });
});
