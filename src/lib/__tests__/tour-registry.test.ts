import { describe, it, expect } from 'vitest';
import { getToursPorPagina } from '../tour-registry';

describe('getToursPorPagina', () => {
  describe('rota /palpites', () => {
    it('retorna tour-palpites para /palpites', () => {
      const tours = getToursPorPagina('/palpites');
      expect(tours).toHaveLength(1);
      expect(tours[0].id).toBe('tour-palpites');
    });

    it('não retorna nada para /palpites/outro', () => {
      const tours = getToursPorPagina('/palpites/outro');
      expect(tours).toHaveLength(0);
    });
  });

  describe('rota /ranking', () => {
    it('retorna tour-ranking para /ranking', () => {
      const tours = getToursPorPagina('/ranking');
      expect(tours).toHaveLength(1);
      expect(tours[0].id).toBe('tour-ranking');
    });
  });

  describe('rota /minha-conta', () => {
    it('retorna tour-conta para /minha-conta', () => {
      const tours = getToursPorPagina('/minha-conta');
      expect(tours).toHaveLength(1);
      expect(tours[0].id).toBe('tour-conta');
    });
  });

  describe('rota /grupos/buscar', () => {
    it('retorna tour-grupos-publicos para /grupos/buscar', () => {
      const tours = getToursPorPagina('/grupos/buscar');
      expect(tours).toHaveLength(1);
      expect(tours[0].id).toBe('tour-grupos-publicos');
    });

    it('não retorna tour-grupo (rota genérica) para /grupos/buscar', () => {
      const tours = getToursPorPagina('/grupos/buscar');
      expect(tours.find((t) => t.id === 'tour-grupo')).toBeUndefined();
    });
  });

  describe('rota /grupos/explorar', () => {
    it('retorna tour-meus-grupos para /grupos/explorar', () => {
      const tours = getToursPorPagina('/grupos/explorar');
      expect(tours).toHaveLength(1);
      expect(tours[0].id).toBe('tour-meus-grupos');
    });

    it('não retorna tour-grupo (rota genérica) para /grupos/explorar', () => {
      const tours = getToursPorPagina('/grupos/explorar');
      expect(tours.find((t) => t.id === 'tour-grupo')).toBeUndefined();
    });
  });

  describe('rota dinâmica /grupos/[grupoId]', () => {
    it('retorna tour-grupo para /grupos/algum-id', () => {
      const tours = getToursPorPagina('/grupos/algum-id-qualquer');
      expect(tours).toHaveLength(1);
      expect(tours[0].id).toBe('tour-grupo');
    });

    it('não retorna nada para /grupos (raiz)', () => {
      const tours = getToursPorPagina('/grupos');
      expect(tours).toHaveLength(0);
    });
  });

  describe('rota sem tour', () => {
    it('retorna array vazio para rota desconhecida', () => {
      expect(getToursPorPagina('/desconhecida')).toHaveLength(0);
    });

    it('retorna array vazio para string vazia', () => {
      expect(getToursPorPagina('')).toHaveLength(0);
    });
  });
});
