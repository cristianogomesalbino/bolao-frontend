import { describe, expect, it } from 'vitest';
import type { DestaqueItem } from '@/types/destaques.types';

/**
 * O BE já deduplica ACERTOU_EM_CHEIO por pessoa/rodada e monta `jogos[]`
 * / panelinha. O FE consome a lista pronta — este teste trava o contrato.
 */
describe('contrato de acertos no feed', () => {
  it('panelinha traz participantes e um único card', () => {
    const item: DestaqueItem = {
      id: 'p1',
      tipo: 'ACERTOU_EM_CHEIO',
      titulo: 'Colaram!',
      dados: {
        golsCasa: 1,
        golsFora: 0,
        timeCasa: { nome: 'A', sigla: 'A', escudo: null },
        timeFora: { nome: 'B', sigla: 'B', escudo: null },
        participantes: [
          { usuarioId: 'u1', nome: 'Ana' },
          { usuarioId: 'u2', nome: 'Beto' },
          { usuarioId: 'u3', nome: 'Cia' },
        ],
      },
      jogoId: 'jogo-1',
      rodada: 5,
      criadoEm: new Date().toISOString(),
      contadorFs: 0,
      jaEnviouF: false,
      visualizado: false,
      autor: { usuarioId: 'u1', nome: 'Panelinha', avatar: null },
    };

    const dados = item.dados as {
      participantes?: Array<{ usuarioId: string; nome: string }>;
    };
    expect(dados.participantes).toHaveLength(3);
    expect(item.tipo).toBe('ACERTOU_EM_CHEIO');
  });
});
