import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { DICAS, getDicasPorPagina } from '@/lib/dica-registry';

describe('DicaRegistry — Property Tests', () => {
  // Feature: hints-independentes, Property 8: Validade estrutural do registry
  it('Property 8: todas as entradas do registry possuem campos obrigatórios válidos', () => {
    for (const dica of DICAS) {
      expect(dica.dicaId).toBeTruthy();
      expect(dica.dicaId.startsWith('dica-')).toBe(true);
      expect(dica.target).toBeTruthy();
      expect(dica.target.startsWith('[data-dica=')).toBe(true);
      expect(dica.titulo).toBeTruthy();
      expect(dica.conteudo).toBeTruthy();
      expect(['top', 'bottom', 'left', 'right', 'auto']).toContain(dica.posicao);
      expect(dica.prioridade).toBeGreaterThanOrEqual(1);
      expect(dica.prioridade).toBeLessThanOrEqual(5);
      expect(dica.pagina).toBeTruthy();
    }
  });

  // Feature: hints-independentes, Property 9: Filtragem por página
  it('Property 9: getDicasPorPagina retorna apenas dicas da página correspondente', () => {
    const pathnames = [
      '/palpites',
      '/ranking',
      '/minha-conta',
      '/grupos/buscar',
      '/grupos/explorar',
      '/grupos/abc-123-uuid',
    ];

    for (const pathname of pathnames) {
      const resultado = getDicasPorPagina(pathname);

      for (const dica of resultado) {
        // Verifica que cada dica retornada corresponde ao pathname
        if (dica.pagina === '/grupos/') {
          expect(pathname.startsWith('/grupos/')).toBe(true);
          expect(pathname).not.toBe('/grupos');
          expect(pathname).not.toBe('/grupos/buscar');
          expect(pathname).not.toBe('/grupos/explorar');
          expect(pathname).not.toBe('/grupos/criar');
        } else {
          expect(pathname).toBe(dica.pagina);
        }
      }
    }
  });

  // Property 9 com inputs aleatórios (completude)
  it('Property 9b: getDicasPorPagina nunca retorna dicas de outra página', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant('/palpites'),
          fc.constant('/ranking'),
          fc.constant('/minha-conta'),
          fc.constant('/grupos/buscar'),
          fc.constant('/grupos/explorar'),
          fc.constant('/grupos/abc-123'),
          fc.constant('/outras-paginas'),
          fc.constant('/'),
        ),
        (pathname) => {
          const resultado = getDicasPorPagina(pathname);

          for (const dica of resultado) {
            if (dica.pagina === '/palpites') expect(pathname).toBe('/palpites');
            else if (dica.pagina === '/ranking') expect(pathname).toBe('/ranking');
            else if (dica.pagina === '/minha-conta') expect(pathname).toBe('/minha-conta');
            else if (dica.pagina === '/grupos/buscar') expect(pathname).toBe('/grupos/buscar');
            else if (dica.pagina === '/grupos/explorar') expect(pathname).toBe('/grupos/explorar');
            else if (dica.pagina === '/grupos/') {
              expect(pathname.startsWith('/grupos/')).toBe(true);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  // Property 8 complementar: unicidade de dicaIds
  it('Property 8b: todos os dicaIds são únicos no registry', () => {
    const ids = DICAS.map((d) => d.dicaId);
    const unicos = new Set(ids);
    expect(unicos.size).toBe(ids.length);
  });
});
