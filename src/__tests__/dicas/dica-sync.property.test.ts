import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { salvarDicaPendente, sincronizarDicasPendentes, DICA_STORAGE_KEY } from '@/lib/dica-sync';

// Mock do service
vi.mock('@/services/dica.service', () => ({
  dispensarDica: vi.fn(),
}));

import { dispensarDica } from '@/services/dica.service';

const dicaIdArb = fc.stringMatching(/^dica-[a-z]+-[a-z-]+$/);

describe('DicaSync — Property Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // Feature: hints-independentes, Property 7: Resiliência offline — round trip
  it('Property 7: sincronizar remove apenas pendentes com API success', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(dicaIdArb, { minLength: 1, maxLength: 6 }),
        fc.array(fc.boolean(), { minLength: 1, maxLength: 6 }),
        async (dicaIds, resultados) => {
          localStorage.clear();
          vi.clearAllMocks();

          const unicos = [...new Set(dicaIds)];
          const resMap = unicos.map((id, i) => ({
            id,
            sucesso: resultados[i % resultados.length],
          }));

          // Salvar todas como pendentes
          for (const { id } of resMap) {
            salvarDicaPendente(id);
          }

          // Configurar mock: success ou failure por dicaId
          const mockedDispensar = vi.mocked(dispensarDica);
          mockedDispensar.mockImplementation(async (dicaId: string) => {
            const entry = resMap.find((r) => r.id === dicaId);
            if (entry && !entry.sucesso) {
              throw new Error('Network error');
            }
          });

          await sincronizarDicasPendentes();

          // Verificar resultado
          const raw = localStorage.getItem(DICA_STORAGE_KEY);
          const restantes: string[] = raw ? (JSON.parse(raw) as string[]) : [];

          for (const { id, sucesso } of resMap) {
            if (sucesso) {
              // Removido da lista
              expect(restantes).not.toContain(id);
            } else {
              // Permanece na lista
              expect(restantes).toContain(id);
            }
          }
        },
      ),
      { numRuns: 50 },
    );
  });

  // Property 7 complementar: salvarDicaPendente é idempotente
  it('Property 7b: salvarDicaPendente não duplica ids', () => {
    fc.assert(
      fc.property(dicaIdArb, fc.integer({ min: 2, max: 5 }), (dicaId, vezes) => {
        localStorage.clear();

        for (let i = 0; i < vezes; i++) {
          salvarDicaPendente(dicaId);
        }

        const raw = localStorage.getItem(DICA_STORAGE_KEY);
        const pendentes: string[] = raw ? (JSON.parse(raw) as string[]) : [];
        const ocorrencias = pendentes.filter((id) => id === dicaId);
        expect(ocorrencias).toHaveLength(1);
      }),
      { numRuns: 100 },
    );
  });
});
