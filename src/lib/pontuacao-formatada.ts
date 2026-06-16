/**
 * Formata pontuação no padrão do projeto: "X ponto" (singular) ou "X pontos" (plural).
 * Em português, singular para 0 e 1. Sem emojis, sem "+", sem "pts".
 */
export function formatarPontuacao(pontos: number): string {
  return `${pontos} ${pontos <= 1 ? 'ponto' : 'pontos'}`;
}
