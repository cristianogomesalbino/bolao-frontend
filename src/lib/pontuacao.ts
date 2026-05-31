/**
 * Constantes de pontuação alinhadas com o backend.
 * Backend: acerto em cheio (3pts), acerto de resultado (1pt), erro (0pts).
 */
export const PONTOS = {
  ACERTO_EM_CHEIO: 3,
  ACERTO_RESULTADO: 1,
} as const;

interface DadosPalpite {
  golsCasa: number;
  golsFora: number;
  jogo?: {
    golsCasa: number | null;
    golsFora: number | null;
    status?: string;
  } | null;
}

function determinarResultado(golsA: number, golsB: number): 'casa' | 'fora' | 'empate' {
  if (golsA > golsB) return 'casa';
  if (golsA < golsB) return 'fora';
  return 'empate';
}

/**
 * Calcula a pontuação de um palpite com base no resultado real do jogo.
 * Regras alinhadas com o backend (ranking module).
 */
export function calcularPontos(p: DadosPalpite): number {
  if (p.jogo?.golsCasa === null || p.jogo?.golsCasa === undefined) return 0;
  if (p.jogo?.golsFora === null || p.jogo?.golsFora === undefined) return 0;

  const { golsCasa: rc, golsFora: rf } = p.jogo;
  const { golsCasa: pc, golsFora: pf } = p;

  // Acerto em cheio (placar exato)
  if (pc === rc && pf === rf) return PONTOS.ACERTO_EM_CHEIO;

  // Acerto de resultado (vitória/empate/derrota)
  const resultadoReal = determinarResultado(rc, rf);
  const resultadoPalpite = determinarResultado(pc, pf);
  if (resultadoReal === resultadoPalpite) return PONTOS.ACERTO_RESULTADO;

  return 0;
}
