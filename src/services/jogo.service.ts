import apiClient from '@/lib/api-client';
import { Fase, JogosResponse } from '@/types/jogo.types';

export async function listarFases(temporadaId: string): Promise<Fase[]> {
  const response = await apiClient.get<Fase[]>(`/temporadas/${temporadaId}/fases`);
  return response.data;
}

export async function listarJogosFase(faseId: string, rodada?: number, status?: string): Promise<JogosResponse> {
  const params: Record<string, unknown> = {};
  if (rodada) params.rodada = rodada;
  if (status) params.status = status;
  const response = await apiClient.get<JogosResponse>(`/fases/${faseId}/jogos`, { params });
  return response.data;
}

export async function buscarProximoJogo(temporadaId: string): Promise<{ fase: Fase; jogo: JogosResponse['jogos'][0] } | null> {
  try {
    const fases = await listarFases(temporadaId);
    const agora = Date.now();

    const candidatos: Array<{ fase: Fase; jogo: JogosResponse['jogos'][0]; diff: number }> = [];

    for (const fase of fases) {
      const { jogos } = await listarJogosFase(fase.id, undefined, 'AGENDADO');

      for (const jogo of jogos) {
        const diff = jogo.dataHora ? new Date(jogo.dataHora).getTime() - agora : Infinity;
        candidatos.push({ fase, jogo, diff });
      }
    }

    // Apenas jogos futuros (que ainda não começaram — margem de 1 min antes)
    const futuros = candidatos.filter((c) => c.diff > 60000).sort((a, b) => a.diff - b.diff);
    if (futuros.length > 0) return { fase: futuros[0].fase, jogo: futuros[0].jogo };

    return null;
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

export async function contarJogosAdiados(temporadaId: string): Promise<number> {
  try {
    const fases = await listarFases(temporadaId);
    let count = 0;

    for (const fase of fases) {
      const { jogos } = await listarJogosFase(fase.id, undefined, 'ADIADO');
      count += jogos.length;
    }

    return count;
  } catch {
    return 0;
  }
}

export async function contarJogosAdiadosRodada(faseId: string, rodada: number): Promise<number> {
  try {
    const { jogos } = await listarJogosFase(faseId, rodada);
    return jogos.filter((j) => j.status === 'ADIADO').length;
  } catch {
    return 0;
  }
}
