import apiClient from '@/lib/api-client';
import { Fase, Jogo, JogosResponse } from '@/types/jogo.types';

export interface Temporada {
  id: string;
  nome: string;
  ano: number;
  campeonatoId: string;
  campeonato?: { id: string; nome: string };
}

export interface DadosTemporada {
  proximoJogo: { fase: Fase; jogo: Jogo } | null;
  totalAdiados: number;
}

export async function listarTemporadas(): Promise<Temporada[]> {
  const response = await apiClient.get<Temporada[]>('/temporadas');
  return response.data;
}

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

/**
 * Busca dados da temporada em uma única operação:
 * - Próximo jogo agendado
 * - Total de jogos adiados
 *
 * Faz apenas 1 chamada de fases + 2 chamadas de jogos por fase (AGENDADO + ADIADO)
 * em paralelo, evitando duplicação de requests.
 */
export async function buscarDadosTemporada(temporadaId: string): Promise<DadosTemporada> {
  try {
    const fases = await listarFases(temporadaId);
    const agora = Date.now();

    let totalAdiados = 0;
    const candidatos: Array<{ fase: Fase; jogo: Jogo; diff: number }> = [];

    // Buscar jogos agendados e adiados de todas as fases em paralelo
    const resultados = await Promise.all(
      fases.map(async (fase) => {
        const [agendados, adiados] = await Promise.all([
          listarJogosFase(fase.id, undefined, 'AGENDADO'),
          listarJogosFase(fase.id, undefined, 'ADIADO'),
        ]);
        return { fase, agendados: agendados.jogos, adiados: adiados.jogos };
      })
    );

    for (const { fase, agendados, adiados } of resultados) {
      totalAdiados += adiados.length;
      // Também contar jogos remarcados (foiAdiado=true, status AGENDADO)
      totalAdiados += agendados.filter((j) => j.foiAdiado).length;

      for (const jogo of agendados) {
        const diff = jogo.dataHora ? new Date(jogo.dataHora).getTime() - agora : Infinity;
        candidatos.push({ fase, jogo, diff });
      }
    }

    // Apenas jogos futuros (margem de 1 min antes)
    const futuros = candidatos.filter((c) => c.diff > 60000).sort((a, b) => a.diff - b.diff);
    const proximoJogo = futuros.length > 0 ? { fase: futuros[0].fase, jogo: futuros[0].jogo } : null;

    return { proximoJogo, totalAdiados };
  } catch {
    return { proximoJogo: null, totalAdiados: 0 };
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

export async function contarJogosAdiadosRodada(faseId: string, rodada: number): Promise<number> {
  try {
    const { jogos } = await listarJogosFase(faseId, rodada);
    return jogos.filter((j) => j.status === 'ADIADO').length;
  } catch {
    return 0;
  }
}
