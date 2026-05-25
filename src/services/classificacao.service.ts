const GE_BASE_URL = 'https://api.globoesporte.globo.com/tabela';
const BRASILEIRAO_CAMPEONATO_ID = 'd1a37fa4-e948-43a6-ba53-ab24ab3a45b1';

export interface ClassificacaoTime {
  posicao: number;
  timeId: string;
  nome: string;
  sigla: string;
  recentForm?: string[];
}

export async function buscarClassificacao(season?: number): Promise<ClassificacaoTime[]> {
  try {
    const { default: apiClient } = await import('@/lib/api-client');
    const params: Record<string, unknown> = {};
    if (season) params.season = season;

    const response = await apiClient.get<ClassificacaoTime[]>('/classificacao', { params });
    return response.data;
  } catch {
    return [];
  }
}

export function obterPosicaoTime(classificacao: ClassificacaoTime[], nomeTime: string): number | null {
  const item = classificacao.find(
    (c) => c.nome.toLowerCase() === nomeTime.toLowerCase() || c.sigla.toLowerCase() === nomeTime.toLowerCase()
  );
  return item?.posicao ?? null;
}

export function obterUltimosJogos(classificacao: ClassificacaoTime[], nomeTime: string): string[] {
  const item = classificacao.find(
    (c) => c.nome.toLowerCase() === nomeTime.toLowerCase() || c.sigla.toLowerCase() === nomeTime.toLowerCase()
  );
  if (!item?.recentForm) return [];
  // Converter W/D/L para V/E/D (português)
  return item.recentForm.map((r) => {
    if (r === 'W') return 'V';
    if (r === 'D') return 'E';
    if (r === 'L') return 'D';
    return r;
  });
}
