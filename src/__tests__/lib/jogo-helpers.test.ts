import { afterEach, describe, expect, it, vi } from 'vitest';
import { jogoEstaAoVivo, obterStatusAtualJogo } from '@/lib/jogo-helpers';

describe('status efetivo do jogo', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('não considera ao vivo um jogo cujo início está no futuro', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-04T12:00:00.000Z'));

    expect(jogoEstaAoVivo('EM_ANDAMENTO', '2026-11-04T12:30:00.000Z')).toBe(false);
    expect(obterStatusAtualJogo('EM_ANDAMENTO', '2026-11-04T12:30:00.000Z')).toBe('AGENDADO');
  });

  it('considera ao vivo o jogo após o horário marcado', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-04T12:30:00.000Z'));

    expect(jogoEstaAoVivo('EM_ANDAMENTO', '2026-11-04T12:00:00.000Z')).toBe(true);
    expect(obterStatusAtualJogo('EM_ANDAMENTO', '2026-11-04T12:00:00.000Z')).toBe('EM_ANDAMENTO');
  });

  it('mantém EM_ANDAMENTO quando dataHora é null', () => {
    expect(jogoEstaAoVivo('EM_ANDAMENTO', null)).toBe(false);
    expect(obterStatusAtualJogo('EM_ANDAMENTO', null)).toBe('EM_ANDAMENTO');
  });

  it('mantém EM_ANDAMENTO quando dataHora é inválida', () => {
    expect(jogoEstaAoVivo('EM_ANDAMENTO', 'data-invalida')).toBe(false);
    expect(obterStatusAtualJogo('EM_ANDAMENTO', 'data-invalida')).toBe('EM_ANDAMENTO');
  });

  it('não altera FINALIZADO', () => {
    expect(obterStatusAtualJogo('FINALIZADO', '2026-11-04T12:00:00.000Z')).toBe('FINALIZADO');
    expect(obterStatusAtualJogo('FINALIZADO', null)).toBe('FINALIZADO');
  });

  it('não altera AGENDADO', () => {
    expect(obterStatusAtualJogo('AGENDADO', '2026-11-04T12:00:00.000Z')).toBe('AGENDADO');
    expect(obterStatusAtualJogo('AGENDADO', null)).toBe('AGENDADO');
  });
});
