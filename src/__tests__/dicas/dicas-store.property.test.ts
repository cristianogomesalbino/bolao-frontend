import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { useDicasStore } from '@/stores/dicas.store';

// Mock services to prevent real API calls
vi.mock('@/services/dica.service', () => ({
  dispensarDica: vi.fn().mockResolvedValue(undefined),
  resetarDicas: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/dica-sync', () => ({
  salvarDicaPendente: vi.fn(),
}));

// Helpers
const dicaIdArb = fc.stringMatching(/^dica-[a-z]+-[a-z-]+$/);

function resetStore() {
  useDicasStore.setState({
    dicasDispensadas: new Set(),
    dicasExibidas: new Set(),
    dicaAtiva: null,
    filaAutoExibicao: [],
  });
}

describe('DicasStore — Property Tests', () => {
  beforeEach(() => {
    resetStore();
  });

  // Feature: hints-independentes, Property 1: Dispensar marca como dispensado
  it('Property 1: dispensar qualquer dicaId marca como dispensado', () => {
    fc.assert(
      fc.property(dicaIdArb, (dicaId) => {
        resetStore();
        useDicasStore.getState().inicializar([]);
        useDicasStore.getState().dispensarDica(dicaId);

        const estado = useDicasStore.getState().obterEstado(dicaId);
        expect(estado).toBe('dispensado');
        expect(useDicasStore.getState().dicasDispensadas.has(dicaId)).toBe(true);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: hints-independentes, Property 2: Fechar sem dispensar marca como exibido
  it('Property 2: marcarComoExibida coloca no set exibidas mas não dispensadas', () => {
    fc.assert(
      fc.property(dicaIdArb, (dicaId) => {
        resetStore();
        useDicasStore.getState().inicializar([]);
        useDicasStore.getState().marcarComoExibida(dicaId);

        const estado = useDicasStore.getState().obterEstado(dicaId);
        expect(estado).toBe('exibido');
        expect(useDicasStore.getState().dicasExibidas.has(dicaId)).toBe(true);
        expect(useDicasStore.getState().dicasDispensadas.has(dicaId)).toBe(false);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: hints-independentes, Property 3: Fila — max 1 ativo por vez
  it('Property 3: fila de auto-exibição mantém no máximo 1 hintAtivo', () => {
    fc.assert(
      fc.property(
        fc.array(dicaIdArb, { minLength: 2, maxLength: 10 }),
        (dicaIds) => {
          resetStore();
          useDicasStore.getState().inicializar([]);

          // Enfileirar todos
          const unicos = [...new Set(dicaIds)];
          for (const id of unicos) {
            useDicasStore.getState().enfileirar(id);
          }

          // Desenfileirar e abrir um por vez
          const primeiro = useDicasStore.getState().desenfileirar();
          if (primeiro) {
            useDicasStore.getState().abrirDica(primeiro);
          }

          // Verificar: apenas 1 ativo
          const ativo = useDicasStore.getState().dicaAtiva;
          expect(ativo).toBe(primeiro);

          // Tentar abrir outro sem fechar — substitui (max 1)
          const segundo = useDicasStore.getState().desenfileirar();
          if (segundo) {
            useDicasStore.getState().abrirDica(segundo);
            expect(useDicasStore.getState().dicaAtiva).toBe(segundo);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: hints-independentes, Property 5: Toque beacon abre tooltip correto
  it('Property 5: abrirDica(id) seta dicaAtiva igual ao id', () => {
    fc.assert(
      fc.property(dicaIdArb, (dicaId) => {
        resetStore();
        useDicasStore.getState().inicializar([]);
        useDicasStore.getState().marcarComoExibida(dicaId);
        useDicasStore.getState().abrirDica(dicaId);

        expect(useDicasStore.getState().dicaAtiva).toBe(dicaId);
      }),
      { numRuns: 100 },
    );
  });

  // Feature: hints-independentes, Property 10: Ordenação por prioridade (FIFO no store)
  it('Property 10: fila desenfileira na ordem de enfileiramento (FIFO)', () => {
    fc.assert(
      fc.property(
        fc.array(dicaIdArb, { minLength: 1, maxLength: 8 }),
        (dicaIds) => {
          resetStore();
          const unicos = [...new Set(dicaIds)];
          for (const id of unicos) {
            useDicasStore.getState().enfileirar(id);
          }

          // Desenfileirar deve respeitar ordem de inserção
          for (const esperado of unicos) {
            const resultado = useDicasStore.getState().desenfileirar();
            expect(resultado).toBe(esperado);
          }

          // Fila vazia
          expect(useDicasStore.getState().desenfileirar()).toBeNull();
        },
      ),
      { numRuns: 100 },
    );
  });

  // Feature: hints-independentes, Property 11: Reset limpa todos
  it('Property 11: resetarTodas limpa dispensadas, exibidas, ativo e fila', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(dicaIdArb, { minLength: 1, maxLength: 5 }),
        async (dicaIds) => {
          resetStore();
          useDicasStore.getState().inicializar(dicaIds);

          // Marcar alguns como exibidos
          for (const id of dicaIds.slice(0, 2)) {
            useDicasStore.getState().marcarComoExibida(id);
          }

          await useDicasStore.getState().resetarTodas();

          const state = useDicasStore.getState();
          expect(state.dicasDispensadas.size).toBe(0);
          expect(state.dicasExibidas.size).toBe(0);
          expect(state.dicaAtiva).toBeNull();
          expect(state.filaAutoExibicao).toHaveLength(0);
        },
      ),
      { numRuns: 50 },
    );
  });
});
