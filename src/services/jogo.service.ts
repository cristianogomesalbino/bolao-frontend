import apiClient from '@/lib/api-client';
import { Fase, JogosResponse } from '@/types/jogo.types';

export async function listarFases(temporadaId: string): Promise<Fase[]> {
  const response = await apiClient.get<Fase[]>(`/temporadas/${temporadaId}/fases`);
  return response.data;
}

export async function listarJogosFase(faseId: string, rodada?: number): Promise<JogosResponse> {
  const params = rodada ? { rodada } : undefined;
  const response = await apiClient.get<JogosResponse>(`/fases/${faseId}/jogos`, { params });
  return response.data;
}

export async function buscarProximoJogo(temporadaId: string): Promise<{ fase: Fase; jogo: JogosResponse['jogos'][0] } | null> {
  try {
    const fases = await listarFases(temporadaId);
    const agora = new Date().getTime();
    
    let melhorJogo: { fase: Fase; jogo: JogosResponse['jogos'][0] } | null = null;
    let menorDiff = Infinity;

    for (const fase of fases) {
      const { jogos } = await listarJogosFase(fase.id);
      for (const jogo of jogos) {
        if (jogo.status !== 'AGENDADO') continue;
        const diff = new Date(jogo.dataHora).getTime() - agora;
        if (diff > 0 && diff < menorDiff) {
          menorDiff = diff;
          melhorJogo = { fase, jogo };
        }
      }
    }

    return melhorJogo;
  } catch {
    return null;
  }
}

export async function buscarProximosJogos(): Promise<import('@/types/jogo.types').JogoProximo[]> {
  try {
    // TODO: substituir por endpoint real quando disponível
    await new Promise((resolve) => setTimeout(resolve, 800));
    const agora = new Date();
    return [
      {
        id: '1',
        timeCasa: 'Flamengo',
        timeFora: 'Palmeiras',
        dataHora: new Date(agora.getFullYear(), agora.getMonth(), agora.getDate(), 21, 30).toISOString(),
        status: 'AGENDADO',
      },
      {
        id: '2',
        timeCasa: 'Brasil',
        timeFora: 'Argentina',
        dataHora: new Date(agora.getFullYear(), agora.getMonth(), agora.getDate() + 3, 22, 0).toISOString(),
        status: 'AGENDADO',
      },
    ];
  } catch {
    return [];
  }
}
